declare module 'react-window' {
    import { ComponentType, CSSProperties, PureComponent } from 'react';

    export interface ListChildComponentProps<T = any> {
        index: number;
        style: CSSProperties;
        data: T;
        isScrolling?: boolean;
    }

    export type ListOnItemsRenderedProps = {
        overscanStartIndex: number;
        overscanStopIndex: number;
        visibleStartIndex: number;
        visibleStopIndex: number;
    };

    export type ListOnScrollProps = {
        scrollDirection: 'forward' | 'backward';
        scrollOffset: number;
        scrollUpdateWasRequested: boolean;
    };

    export interface FixedSizeListProps<T = any> {
        children: ComponentType<ListChildComponentProps<T>>;
        className?: string;
        direction?: 'horizontal' | 'vertical';
        height: number;
        initialScrollOffset?: number;
        innerElementType?: string | ComponentType<any>;
        innerRef?: React.Ref<any>;
        innerTagName?: string;
        itemCount: number;
        itemData?: T;
        itemKey?: (index: number, data: T) => any;
        itemSize: number;
        layout?: 'horizontal' | 'vertical';
        onItemsRendered?: (props: ListOnItemsRenderedProps) => any;
        onScroll?: (props: ListOnScrollProps) => any;
        outerElementType?: string | ComponentType<any>;
        outerRef?: React.Ref<any>;
        outerTagName?: string;
        overscanCount?: number;
        style?: CSSProperties;
        useIsScrolling?: boolean;
        width?: number | string;
    }

    export class FixedSizeList<T = any> extends PureComponent<FixedSizeListProps<T>> {
        scrollTo(scrollOffset: number): void;
        scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
    }

    export interface VariableSizeListProps<T = any> extends Omit<FixedSizeListProps<T>, 'itemSize'> {
        itemSize: (index: number) => number;
        estimatedItemSize?: number;
    }

    export class VariableSizeList<T = any> extends PureComponent<VariableSizeListProps<T>> {
        scrollTo(scrollOffset: number): void;
        scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
        resetAfterIndex(index: number, shouldForceUpdate?: boolean): void;
    }
}
