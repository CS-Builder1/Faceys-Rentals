import { createContext, useContext, useState, ReactNode } from 'react';
import { InventoryItem } from '../types';

export interface CartItem {
    inventoryItem: InventoryItem;
    quantity: number;
}

interface QuoteContextType {
    cartItems: CartItem[];
    addToCart: (item: InventoryItem, quantity?: number) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotalCount: number;
    cartSubtotal: number;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (item: InventoryItem, quantity: number = 1) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.inventoryItem.id === item.id);
            if (existing) {
                return prev.map(i =>
                    i.inventoryItem.id === item.id
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            }
            return [...prev, { inventoryItem: item, quantity }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCartItems(prev => prev.filter(i => i.inventoryItem.id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        setCartItems(prev => prev.map(i =>
            i.inventoryItem.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
        ));
    };

    const clearCart = () => setCartItems([]);

    const cartTotalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Using rentalPrice as default for subtotal calculations
    const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.inventoryItem.rentalPrice * item.quantity), 0);

    return (
        <QuoteContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotalCount,
            cartSubtotal
        }}>
            {children}
        </QuoteContext.Provider>
    );
};

export const useQuote = () => {
    const context = useContext(QuoteContext);
    if (context === undefined) {
        throw new Error('useQuote must be used within a QuoteProvider');
    }
    return context;
};
