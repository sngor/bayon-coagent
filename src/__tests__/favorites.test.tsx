import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '@/hooks/use-favorites';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock useUser hook
jest.mock('@/aws/auth', () => ({
    useUser: () => ({
        user: { id: 'test-user-123' }
    })
}));

describe('useFavorites', () => {
    beforeEach(() => {
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        localStorageMock.clear.mockClear();
    });

    it('should initialize with default favorites for new users', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const { result } = renderHook(() => useFavorites());

        expect(result.current.favorites).toHaveLength(4);
        expect(result.current.favorites[0].id).toBe('studio-write');
        expect(result.current.favorites[1].id).toBe('research-agent');
        expect(result.current.favorites[2].id).toBe('tools-calculator');
        expect(result.current.favorites[3].id).toBe('brand-competitors');
    });

    it('should load favorites from localStorage', () => {
        const storedFavorites = [
            {
                id: 'test-page',
                title: 'Test Page',
                description: 'A test page',
                href: '/test',
                icon: 'TestIcon',
                color: 'bg-blue-500',
                gradient: 'from-blue-500 to-blue-600',
                addedAt: '2023-01-01T00:00:00.000Z'
            }
        ];

        localStorageMock.getItem.mockReturnValue(JSON.stringify(storedFavorites));

        const { result } = renderHook(() => useFavorites());

        expect(result.current.favorites).toEqual(storedFavorites);
    });

    it('should add a favorite', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

        const { result } = renderHook(() => useFavorites());

        const newFavorite = {
            id: 'new-page',
            title: 'New Page',
            description: 'A new page',
            href: '/new',
            icon: 'NewIcon',
            color: 'bg-green-500',
            gradient: 'from-green-500 to-green-600'
        };

        act(() => {
            result.current.addFavorite(newFavorite);
        });

        expect(result.current.favorites).toHaveLength(1);
        expect(result.current.favorites[0].id).toBe('new-page');
        expect(result.current.isFavorite('new-page')).toBe(true);
    });

    it('should remove a favorite', () => {
        const initialFavorites = [
            {
                id: 'page-to-remove',
                title: 'Page to Remove',
                description: 'This will be removed',
                href: '/remove',
                icon: 'RemoveIcon',
                color: 'bg-red-500',
                gradient: 'from-red-500 to-red-600',
                addedAt: '2023-01-01T00:00:00.000Z'
            }
        ];

        localStorageMock.getItem.mockReturnValue(JSON.stringify(initialFavorites));

        const { result } = renderHook(() => useFavorites());

        act(() => {
            result.current.removeFavorite('page-to-remove');
        });

        expect(result.current.favorites).toHaveLength(0);
        expect(result.current.isFavorite('page-to-remove')).toBe(false);
    });

    it('should toggle a favorite', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

        const { result } = renderHook(() => useFavorites());

        const toggleItem = {
            id: 'toggle-page',
            title: 'Toggle Page',
            description: 'This will be toggled',
            href: '/toggle',
            icon: 'ToggleIcon',
            color: 'bg-purple-500',
            gradient: 'from-purple-500 to-purple-600'
        };

        // Add the favorite
        act(() => {
            result.current.toggleFavorite(toggleItem);
        });

        expect(result.current.isFavorite('toggle-page')).toBe(true);

        // Remove the favorite
        act(() => {
            result.current.toggleFavorite(toggleItem);
        });

        expect(result.current.isFavorite('toggle-page')).toBe(false);
    });
});