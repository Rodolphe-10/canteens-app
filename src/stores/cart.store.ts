import { create } from 'zustand'

export interface CartItem {
  id: string
  nameFr: string
  price: number
  quantity: number
  notes?: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  orderType: 'takeaway' | 'dine-in'
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  toggleCart: () => void
  setOrderType: (type: 'takeaway' | 'dine-in') => void
  totalItems: () => number
  totalAmount: () => number
}

export const selectCartItemCount = (state: CartStore) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0)

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  orderType: 'takeaway',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    })
  },

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  updateQty: (id, qty) => {
    if (qty <= 0) {
      get().removeItem(id)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    }))
  },

  clearCart: () => set({ items: [] }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setOrderType: (type) => set({ orderType: type }),
  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}))
