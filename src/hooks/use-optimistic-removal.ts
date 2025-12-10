import { useReducer, useCallback } from 'react';

interface RemovalState {
    removingIds: Set<string>;
}

type RemovalAction =
    | { type: 'START_REMOVING'; id: string }
    | { type: 'FINISH_REMOVING'; id: string }
    | { type: 'REVERT_REMOVING'; id: string };

function removalReducer(state: RemovalState, action: RemovalAction): RemovalState {
    switch (action.type) {
        case 'START_REMOVING':
            return {
                ...state,
                removingIds: new Set(state.removingIds).add(action.id)
            };
        case 'FINISH_REMOVING':
        case 'REVERT_REMOVING':
            const newSet = new Set(state.removingIds);
            newSet.delete(action.id);
            return {
                ...state,
                removingIds: newSet
            };
        default:
            return state;
    }
}

export function useOptimisticRemoval() {
    const [state, dispatch] = useReducer(removalReducer, { removingIds: new Set<string>() });

    const handleOptimisticRemoval = useCallback(async (
        id: string,
        removeAction: (id: string) => void | Promise<void>
    ) => {
        dispatch({ type: 'START_REMOVING', id });

        try {
            await Promise.resolve(removeAction(id));
            dispatch({ type: 'FINISH_REMOVING', id });
        } catch (error) {
            dispatch({ type: 'REVERT_REMOVING', id });
            throw error;
        }
    }, []);

    return {
        removingIds: state.removingIds,
        handleOptimisticRemoval
    };
}