'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquareQuote, Send, Edit, Trash2 } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { toast } from '@/hooks/use-toast';
import { StandardLoadingSpinner } from '@/components/standard';
import { GradientText, Typewriter } from '@/components/ui/text-animations';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';
import type { Testimonial, TestimonialRequest } from '@/lib/types/common/common';
import { TestimonialList } from '@/components/testimonial-list';
import { TestimonialForm, type TestimonialFormData } from '@/components/testimonial-form';
import { TestimonialRequestForm } from '@/components/testimonial-request-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsContent as TabsContent,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TestimonialsPage() {
    const { user, isUserLoading } = useUser();
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [requests, setRequests] = useState<TestimonialRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewTestimonialOpen, setIsNewTestimonialOpen] = useState(false);
    const [isRequestTestimonialOpen, setIsRequestTestimonialOpen] = useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

    // Load testimonials and requests
    useEffect(() => {
        const loadData = async () => {
            if (isUserLoading) return;

            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // TODO: Implement getTestimonialsAction and getTestimonialRequestsAction
                // const { getTestimonialsAction, getTestimonialRequestsAction } = await import('@/app/testimonial-actions');
                // const [testimonialsResult, requestsResult] = await Promise.all([
                //   getTestimonialsAction(user.id),
                //   getTestimonialRequestsAction(user.id),
                // ]);

                // if (testimonialsResult.message === 'success' && testimonialsResult.data) {
                //   setTestimonials(testimonialsResult.data);
                // }

                // if (requestsResult.message === 'success' && requestsResult.data) {
                //   setRequests(requestsResult.data);
                // }

                // Placeholder for now
                setTestimonials([]);
                setRequests([]);
            } catch (error) {
                console.error('Failed to load data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Failed to Load Data',
                    description: 'Could not load your testimonials. Please try refreshing the page.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user?.id, isUserLoading]);

    const handleTestimonialClick = (testimonial: Testimonial) => {
        setSelectedTestimonial(testimonial);
        setIsDetailOpen(true);
    };

    const handleCreateTestimonial = async (data: TestimonialFormData) => {
        if (!user?.id) return;

        try {
            // TODO: Implement createTestimonialAction
            // const { createTestimonialAction } = await import('@/app/testimonial-actions');
            // const result = await createTestimonialAction(user.id, data);

            // if (result.message === 'success' && result.data) {
            //   setTestimonials(prev => [result.data, ...prev]);
            //   setIsNewTestimonialOpen(false);
            //   toast({
            //     title: 'Testimonial Created',
            //     description: 'Your testimonial has been added successfully.',
            //   });
            // }

            toast({
                title: 'Coming Soon',
                description: 'Testimonial creation will be implemented soon.',
            });
            setIsNewTestimonialOpen(false);
        } catch (error) {
            console.error('Failed to create testimonial:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Create',
                description: 'Could not create testimonial. Please try again.',
            });
        }
    };

    const handleUpdateTestimonial = async (data: TestimonialFormData) => {
        if (!user?.id || !selectedTestimonial) return;

        try {
            // TODO: Implement updateTestimonialAction
            // const { updateTestimonialAction } = await import('@/app/testimonial-actions');
            // const result = await updateTestimonialAction(user.id, selectedTestimonial.id, data);

            // if (result.message === 'success' && result.data) {
            //   setTestimonials(prev => prev.map(t => t.id === selectedTestimonial.id ? result.data : t));
            //   setIsEditOpen(false);
            //   setIsDetailOpen(false);
            //   toast({
            //     title: 'Testimonial Updated',
            //     description: 'Your testimonial has been updated successfully.',
            //   });
            // }

            toast({
                title: 'Coming Soon',
                description: 'Testimonial editing will be implemented soon.',
            });
            setIsEditOpen(false);
        } catch (error) {
            console.error('Failed to update testimonial:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Update',
                description: 'Could not update testimonial. Please try again.',
            });
        }
    };

    const handleDeleteTestimonial = async () => {
        if (!user?.id || !testimonialToDelete) return;

        try {
            // TODO: Implement deleteTestimonialAction
            // const { deleteTestimonialAction } = await import('@/app/testimonial-actions');
            // const result = await deleteTestimonialAction(user.id, testimonialToDelete.id);

            // if (result.message === 'success') {
            //   setTestimonials(prev => prev.filter(t => t.id !== testimonialToDelete.id));
            //   setIsDeleteDialogOpen(false);
            //   setIsDetailOpen(false);
            //   setTestimonialToDelete(null);
            //   toast({
            //     title: 'Testimonial Deleted',
            //     description: 'Your testimonial has been removed.',
            //   });
            // }

            toast({
                title: 'Coming Soon',
                description: 'Testimonial deletion will be implemented soon.',
            });
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error('Failed to delete testimonial:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Delete',
                description: 'Could not delete testimonial. Please try again.',
            });
        }
    };

    const handleSendRequest = async (data: { clientName: string; clientEmail: string }) => {
        if (!user?.id) return;

        try {
            // TODO: Implement sendTestimonialRequestAction
            // const { sendTestimonialRequestAction } = await import('@/app/testimonial-actions');
            // const result = await sendTestimonialRequestAction(user.id, data);

            // if (result.message === 'success' && result.data) {
            //   setRequests(prev => [result.data, ...prev]);
            //   toast({
            //     title: 'Request Sent',
            //     description: `Testimonial request sent to ${data.clientEmail}`,
            //   });
            // }

            toast({
                title: 'Coming Soon',
                description: 'Testimonial requests will be implemented soon.',
            });
        } catch (error) {
            console.error('Failed to send request:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Send',
                description: 'Could not send testimonial request. Please try again.',
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden">
                <CardGradientMesh>
                    <CardHeader className="pb-6 relative z-10">
                        <CardTitle className="font-headline flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageSquareQuote className="h-6 w-6 text-primary" />
                                <GradientText text="Client Testimonials" />
                            </div>
                            {(() => {
                                const pageMetadata = getPageMetadata('/brand/testimonials');
                                return pageMetadata ? <FavoritesButton item={pageMetadata} /> : null;
                            })()}
                        </CardTitle>
                        <CardDescription>
                            <Typewriter
                                text="Collect, organize, and showcase client feedback to build trust and credibility"
                                speed={30}
                                delay={500}
                                cursor={false}
                            />
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-0 relative z-10">
                        <Tabs defaultValue="testimonials">
                            <TabsList>
                                <TabsTrigger value="testimonials">
                                    <span className="whitespace-nowrap">All Testimonials</span>
                                </TabsTrigger>
                                <TabsTrigger value="requests">
                                    <span className="whitespace-nowrap">Requests</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="testimonials" className="mt-6">
                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3 mb-6">
                                    <Dialog open={isNewTestimonialOpen} onOpenChange={setIsNewTestimonialOpen}>
                                        <Button onClick={() => setIsNewTestimonialOpen(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New Testimonial
                                        </Button>
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Add New Testimonial</DialogTitle>
                                                <DialogDescription>
                                                    Add a testimonial from a client manually
                                                </DialogDescription>
                                            </DialogHeader>
                                            {user?.id && (
                                                <TestimonialForm
                                                    userId={user.id}
                                                    onSubmit={handleCreateTestimonial}
                                                    onCancel={() => setIsNewTestimonialOpen(false)}
                                                />
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog open={isRequestTestimonialOpen} onOpenChange={setIsRequestTestimonialOpen}>
                                        <Button variant="outline" onClick={() => setIsRequestTestimonialOpen(true)}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Request Testimonial
                                        </Button>
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Request Testimonial</DialogTitle>
                                                <DialogDescription>
                                                    Send an email request to a client asking for a testimonial
                                                </DialogDescription>
                                            </DialogHeader>
                                            <TestimonialRequestForm
                                                onSubmit={handleSendRequest}
                                                requests={requests}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <Separator className="mb-6" />

                                {/* Testimonials List */}
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <StandardLoadingSpinner size="lg" className="mr-3" />
                                        <span className="text-muted-foreground">Loading testimonials...</span>
                                    </div>
                                ) : (
                                    <TestimonialList
                                        testimonials={testimonials}
                                        onTestimonialClick={handleTestimonialClick}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="requests" className="mt-6">
                                <TestimonialRequestForm
                                    onSubmit={handleSendRequest}
                                    requests={requests}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Testimonial Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    {selectedTestimonial && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedTestimonial.clientName}</SheetTitle>
                                <SheetDescription>
                                    Received on {new Date(selectedTestimonial.dateReceived).toLocaleDateString()}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                {selectedTestimonial.clientPhotoUrl && (
                                    <div className="flex justify-center">
                                        <img
                                            src={selectedTestimonial.clientPhotoUrl}
                                            alt={selectedTestimonial.clientName}
                                            className="w-24 h-24 rounded-full object-cover"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-semibold mb-2">Testimonial</h4>
                                    <p className="text-muted-foreground">{selectedTestimonial.testimonialText}</p>
                                </div>
                                {selectedTestimonial.tags.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTestimonial.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setIsDetailOpen(false);
                                            setIsEditOpen(true);
                                        }}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => {
                                            setTestimonialToDelete(selectedTestimonial);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Edit Testimonial Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Testimonial</DialogTitle>
                        <DialogDescription>
                            Update the testimonial details
                        </DialogDescription>
                    </DialogHeader>
                    {user?.id && selectedTestimonial && (
                        <TestimonialForm
                            userId={user.id}
                            testimonial={selectedTestimonial}
                            onSubmit={handleUpdateTestimonial}
                            onCancel={() => setIsEditOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the testimonial from {testimonialToDelete?.clientName}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTestimonial} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
