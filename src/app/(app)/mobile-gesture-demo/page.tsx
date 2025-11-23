import { Metadata } from 'next';
import GestureDemo from '@/components/mobile/gesture-demo';

export const metadata: Metadata = {
    title: 'Mobile Gesture Demo - Bayon Coagent',
    description: 'Test mobile gesture handling including swipe, pinch, and long-press interactions',
};

export default function MobileGestureDemoPage() {
    return (
        <div className="container mx-auto py-8">
            <GestureDemo />
        </div>
    );
}