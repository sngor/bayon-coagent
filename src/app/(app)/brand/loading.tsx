import { PageLoading } from '@/components/ui/page-loading';
import { LOADING_MESSAGES } from '@/lib/constants/loading-messages';

export default function Loading() {
    return <PageLoading text={LOADING_MESSAGES.HUBS.BRAND} variant="hub" />;
}