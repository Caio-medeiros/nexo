// comanda.js — NEXO Comanda Engine v2
// Rounds-based ordering like professional POS systems
// (Toast, Lightspeed). Single source of truth shared by
// the menu template AND the portal pages.
//
// Load with: <script src="/js/comanda.js"></script>
// Then call Comanda.<method>(db, ...) where `db` is a
// Supabase client.

const Comanda = {

  // ─────────────────────────────────────────
  // CREATE OR GET COMANDA FOR TABLE
  // ─────────────────────────────────────────

  async openForTable(db, espacoSlug, tableLabel,
                      guestCount = 1, mode = 'dine_in') {
    // Check for an existing open comanda for this table
    const { data: existing } = await db
      .from('comandas')
      .select('*')
      .eq('espaco_slug', espacoSlug)
      .eq('table_label', tableLabel)
      .in('status', ['open', 'submitted', 'preparing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing;

    // Create new comanda
    const { data, error } = await db
      .from('comandas')
      .insert({
        espaco_slug: espacoSlug,
        table_label: tableLabel,
        guest_count: guestCount,
        mode,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─────────────────────────────────────────
  // ADD ITEM TO PENDING
  // Items start as 'pending' — not yet sent to kitchen.
  // No round_id until fired.
  // ─────────────────────────────────────────

  async addItem(db, comandaId, item, addedBy = 'customer') {
    // Merge identical pending item (increment quantity
    // instead of duplicating) — only when no notes.
    const { data: existing } = await db
      .from('comanda_items')
      .select('id, quantity')
      .eq('comanda_id', comandaId)
      .eq('item_name', item.name)
      .eq('status', 'pending')
      .eq('course', item.course || 'principal')
      .is('round_id', null)
      .maybeSingle();

    if (existing && !item.notes) {
      const { data, error } = await db
        .from('comanda_items')
        .update({
          quantity: existing.quantity + (item.qty || 1)
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, merged: true };
    }

    // Add as new pending item
    const { data, error } = await db
      .from('comanda_items')
      .insert({
        comanda_id: comandaId,
        espaco_slug: item.espacoSlug,
        item_id: item.id || null,
        item_name: item.name,
        item_category: item.category || null,
        item_price: item.price || 0,
        quantity: item.qty || 1,
        notes: item.notes || null,
        course: item.course || 'principal',
        added_by: addedBy,
        status: 'pending',
        round_id: null,  // explicit: not yet fired
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─────────────────────────────────────────
  // REMOVE PENDING ITEM
  // Only works on pending items (round_id IS NULL).
  // If item was sent, use voidItem() instead.
  // ─────────────────────────────────────────

  async removePendingItem(db, itemId) {
    const { data: item } = await db
      .from('comanda_items')
      .select('status, round_id, quantity')
      .eq('id', itemId)
      .single();

    if (!item) throw new Error('Item não encontrado');
    if (item.round_id !== null ||
        item.status !== 'pending') {
      throw new Error(
        'Este item já foi enviado para a cozinha. ' +
        'Use "Anular" para itens enviados.'
      );
    }

    const { error } = await db
      .from('comanda_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  },

  // ─────────────────────────────────────────
  // DECREASE PENDING ITEM QUANTITY
  // ─────────────────────────────────────────

  async decreasePendingQuantity(db, itemId) {
    const { data: item } = await db
      .from('comanda_items')
      .select('status, round_id, quantity')
      .eq('id', itemId)
      .single();

    if (!item || item.round_id !== null) {
      throw new Error('Item já enviado para cozinha');
    }

    if (item.quantity <= 1) {
      return this.removePendingItem(db, itemId);
    }

    const { data, error } = await db
      .from('comanda_items')
      .update({ quantity: item.quantity - 1 })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─────────────────────────────────────────
  // INCREASE PENDING ITEM QUANTITY
  // ─────────────────────────────────────────

  async increasePendingQuantity(db, itemId) {
    const { data: item } = await db
      .from('comanda_items')
      .select('status, round_id, quantity')
      .eq('id', itemId)
      .single();

    if (!item || item.round_id !== null) {
      throw new Error('Item já enviado para cozinha');
    }

    const { data, error } = await db
      .from('comanda_items')
      .update({ quantity: item.quantity + 1 })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─────────────────────────────────────────
  // VOID SENT ITEM
  // For items already in kitchen (have round_id).
  // Creates a void notification for kitchen (DB trigger).
  // ─────────────────────────────────────────

  async voidItem(db, itemId, reason, voidBy = 'staff') {
    const { data: item } = await db
      .from('comanda_items')
      .select('status, round_id, item_name')
      .eq('id', itemId)
      .single();

    if (!item) throw new Error('Item não encontrado');
    if (!item.round_id) {
      // Still pending — just remove it
      return this.removePendingItem(db, itemId);
    }
    if (item.status === 'cancelled') {
      throw new Error('Item já anulado');
    }
    if (item.status === 'served' ||
        item.status === 'delivered') {
      throw new Error(
        'Item já servido, não pode ser anulado'
      );
    }

    const { data, error } = await db
      .from('comanda_items')
      .update({
        status: 'cancelled',
        void_reason: reason,
        void_at: new Date().toISOString(),
        void_by: voidBy,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    // create_void_notification trigger fires automatically
    return data;
  },

  // ─────────────────────────────────────────
  // FIRE TO KITCHEN (create a round)
  // Core operation. Only pending items (round_id IS NULL)
  // are fired. Kitchen sees ONLY this round's items.
  // ─────────────────────────────────────────

  async fireToKitchen(db, comandaId, espacoSlug,
                       firedBy = 'customer') {
    const { data: pendingItems } = await db
      .from('comanda_items')
      .select('*')
      .eq('comanda_id', comandaId)
      .eq('status', 'pending')
      .is('round_id', null);

    if (!pendingItems || pendingItems.length === 0) {
      throw new Error('Sem itens para enviar');
    }

    // Next round number
    const { data: lastRound } = await db
      .from('comanda_rounds')
      .select('round_number')
      .eq('comanda_id', comandaId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextRound = (lastRound?.round_number || 0) + 1;

    // Create the round
    const { data: round, error: roundError } = await db
      .from('comanda_rounds')
      .insert({
        comanda_id: comandaId,
        espaco_slug: espacoSlug,
        round_number: nextRound,
        fired_by: firedBy,
        item_count: pendingItems.length,
      })
      .select()
      .single();

    if (roundError) throw roundError;

    // Assign round to all pending items
    const itemIds = pendingItems.map(i => i.id);
    const { error: updateError } = await db
      .from('comanda_items')
      .update({
        status: 'sent',
        round_id: round.id,
        round_number: nextRound,
      })
      .in('id', itemIds);

    if (updateError) throw updateError;

    // Update comanda status
    await db.from('comandas')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', comandaId);

    return {
      round,
      items: pendingItems,
      roundNumber: nextRound,
    };
  },

  // ─────────────────────────────────────────
  // GET FULL COMANDA (waiter / bill view)
  // Shows everything: all rounds, all items, voids.
  // ─────────────────────────────────────────

  async getFullComanda(db, comandaId) {
    const [comanda, items, rounds] = await Promise.all([
      db.from('comandas')
        .select('*')
        .eq('id', comandaId)
        .single(),
      db.from('comanda_items')
        .select('*')
        .eq('comanda_id', comandaId)
        .order('created_at'),
      db.from('comanda_rounds')
        .select('*')
        .eq('comanda_id', comandaId)
        .order('round_number'),
    ]);

    const allItems = items.data || [];

    return {
      comanda: comanda.data,
      items: allItems,
      rounds: rounds.data || [],

      // Computed helpers
      pendingItems: allItems.filter(
        i => i.status === 'pending' && !i.round_id
      ),
      sentItems: allItems.filter(
        i => i.round_id && i.status !== 'cancelled'
      ),
      cancelledItems: allItems.filter(
        i => i.status === 'cancelled'
      ),
      billableTotal: allItems
        .filter(i => i.status !== 'cancelled')
        .reduce((s, i) =>
          s + (i.item_price * i.quantity), 0),
    };
  },

  // ─────────────────────────────────────────
  // GET KITCHEN VIEW (rounds only)
  // Returns active rounds with their items.
  // NEVER shows running totals.
  // ─────────────────────────────────────────

  async getKitchenRounds(db, espacoSlug) {
    const { data: rounds } = await db
      .from('comanda_rounds')
      .select(`
        *,
        comandas!inner(table_label, status, mode),
        comanda_items(
          id, item_name, quantity, notes,
          course, status, added_by
        )
      `)
      .eq('espaco_slug', espacoSlug)
      .in('status', ['fired', 'acknowledged'])
      .in('comandas.status', [
        'open', 'submitted', 'preparing'
      ])
      .order('fired_at');

    return rounds || [];
  },

  // ─────────────────────────────────────────
  // MARK ITEM STATUS (kitchen use)
  // ─────────────────────────────────────────

  async markItemStatus(db, itemId, newStatus) {
    const allowed = ['preparing', 'ready', 'served'];
    if (!allowed.includes(newStatus)) {
      throw new Error('Estado inválido');
    }

    const { data, error } = await db
      .from('comanda_items')
      .update({
        status: newStatus,
        ...(newStatus === 'served'
          ? { served_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─────────────────────────────────────────
  // ACKNOWLEDGE / COMPLETE ROUND (kitchen use)
  // ─────────────────────────────────────────

  async acknowledgeRound(db, roundId) {
    const { data, error } = await db
      .from('comanda_rounds')
      .update({ status: 'acknowledged' })
      .eq('id', roundId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markRoundDone(db, roundId) {
    // Mark all non-terminal items in the round ready.
    const { data: items } = await db
      .from('comanda_items')
      .select('id, status')
      .eq('round_id', roundId)
      .not('status', 'in',
        '(ready,served,delivered,cancelled)');

    if (items && items.length) {
      await db.from('comanda_items')
        .update({ status: 'ready' })
        .in('id', items.map(i => i.id));
    }

    // Trigger will flip the round to 'done', but set it
    // explicitly too for immediacy.
    const { data, error } = await db
      .from('comanda_rounds')
      .update({ status: 'done' })
      .eq('id', roundId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─────────────────────────────────────────
  // CLOSE COMANDA (payment done)
  // ─────────────────────────────────────────

  async close(db, comandaId) {
    const { count } = await db
      .from('comanda_items')
      .select('*', { count: 'exact', head: true })
      .eq('comanda_id', comandaId)
      .eq('status', 'pending')
      .is('round_id', null);

    if (count > 0) {
      throw new Error(
        `Há ${count} iten${count !== 1 ? 's' : ''} ` +
        `por enviar à cozinha. ` +
        `Envie ou remova antes de fechar.`
      );
    }

    const { data, error } = await db
      .from('comandas')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', comandaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

};

if (typeof window !== 'undefined') window.Comanda = Comanda;
