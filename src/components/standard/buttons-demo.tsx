'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    SaveButton,
    CancelButton,
    DeleteButton,
    CreateButton,
    SubmitButton,
    BackButton,
    NextButton,
    DownloadButton,
    UploadButton,
    CopyButton,
    EditButton,
    RefreshButton,
    SearchButton,
    SendButton,
    GenerateButton,
    AIButton,
    FormActions,
    DialogActions,
    CloseIconButton,
    DeleteIconButton,
    EditIconButton,
    CopyIconButton,
    RefreshIconButton,
} from './buttons';

/**
 * Demo component showcasing all standardized button components
 * Use this as a reference for button usage across the application
 */
export function ButtonsDemo() {
    const [loading, setLoading] = React.useState<Record<string, boolean>>({});

    const handleClick = (buttonName: string) => {
        setLoading((prev) => ({ ...prev, [buttonName]: true }));
        setTimeout(() => {
            setLoading((prev) => ({ ...prev, [buttonName]: false }));
        }, 2000);
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Standardized Button Components</h1>
                <p className="text-muted-foreground">
                    A showcase of all available standardized button components for consistent UI across the application.
                </p>
            </div>

            {/* Common Action Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>Common Action Buttons</CardTitle>
                    <CardDescription>
                        Standard buttons for common actions like save, cancel, delete, etc.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Save</p>
                            <SaveButton
                                onClick={() => handleClick('save')}
                                loading={loading.save}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Cancel</p>
                            <CancelButton onClick={() => console.log('Cancel')} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Delete</p>
                            <DeleteButton
                                onClick={() => handleClick('delete')}
                                loading={loading.delete}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Create</p>
                            <CreateButton
                                onClick={() => handleClick('create')}
                                loading={loading.create}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Submit</p>
                            <SubmitButton
                                onClick={() => handleClick('submit')}
                                loading={loading.submit}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Back</p>
                            <BackButton onClick={() => console.log('Back')} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Next</p>
                            <NextButton onClick={() => console.log('Next')} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Download</p>
                            <DownloadButton
                                onClick={() => handleClick('download')}
                                loading={loading.download}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Upload</p>
                            <UploadButton
                                onClick={() => handleClick('upload')}
                                loading={loading.upload}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Copy</p>
                            <CopyButton
                                onClick={() => handleClick('copy')}
                                loading={loading.copy}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Edit</p>
                            <EditButton onClick={() => console.log('Edit')} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Refresh</p>
                            <RefreshButton
                                onClick={() => handleClick('refresh')}
                                loading={loading.refresh}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Search</p>
                            <SearchButton
                                onClick={() => handleClick('search')}
                                loading={loading.search}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Send</p>
                            <SendButton
                                onClick={() => handleClick('send')}
                                loading={loading.send}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI-Specific Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>AI-Specific Buttons</CardTitle>
                    <CardDescription>
                        Buttons for AI-powered actions with special styling.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Generate</p>
                            <GenerateButton
                                onClick={() => handleClick('generate')}
                                loading={loading.generate}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">AI Action</p>
                            <AIButton
                                onClick={() => handleClick('ai')}
                                loading={loading.ai}
                            >
                                Analyze with AI
                            </AIButton>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Custom AI</p>
                            <AIButton
                                onClick={() => handleClick('ai-custom')}
                                loading={loading['ai-custom']}
                            >
                                Optimize Content
                            </AIButton>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Icon-Only Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>Icon-Only Buttons</CardTitle>
                    <CardDescription>
                        Compact icon buttons for common actions (hover to see tooltip).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 flex-wrap">
                        <CloseIconButton onClick={() => console.log('Close')} />
                        <DeleteIconButton onClick={() => console.log('Delete')} />
                        <EditIconButton onClick={() => console.log('Edit')} />
                        <CopyIconButton onClick={() => console.log('Copy')} />
                        <RefreshIconButton onClick={() => console.log('Refresh')} />
                    </div>
                </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Form Actions</CardTitle>
                    <CardDescription>
                        Pre-configured button groups for forms and dialogs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Right Aligned (Default)</p>
                        <FormActions
                            onCancel={() => console.log('Cancel')}
                            onSubmit={() => handleClick('form-submit')}
                            isSubmitting={loading['form-submit']}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Left Aligned</p>
                        <FormActions
                            alignment="left"
                            onCancel={() => console.log('Cancel')}
                            onSubmit={() => handleClick('form-submit-left')}
                            isSubmitting={loading['form-submit-left']}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Space Between</p>
                        <FormActions
                            alignment="between"
                            onCancel={() => console.log('Cancel')}
                            onSubmit={() => handleClick('form-submit-between')}
                            isSubmitting={loading['form-submit-between']}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Center Aligned</p>
                        <FormActions
                            alignment="center"
                            onCancel={() => console.log('Cancel')}
                            onSubmit={() => handleClick('form-submit-center')}
                            isSubmitting={loading['form-submit-center']}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Custom Submit Text</p>
                        <FormActions
                            onCancel={() => console.log('Cancel')}
                            onSubmit={() => handleClick('form-save')}
                            submitText="Save Changes"
                            cancelText="Discard"
                            isSubmitting={loading['form-save']}
                            submitLoadingText="Saving changes..."
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Dialog Actions</p>
                        <DialogActions
                            onClose={() => console.log('Close')}
                            onSubmit={() => handleClick('dialog-submit')}
                            submitText="Confirm"
                            closeText="Cancel"
                            isSubmitting={loading['dialog-submit']}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Custom Buttons</p>
                        <FormActions alignment="between">
                            <BackButton onClick={() => console.log('Back')} />
                            <div className="flex gap-2">
                                <CancelButton onClick={() => console.log('Cancel')} />
                                <SaveButton
                                    onClick={() => handleClick('custom-save')}
                                    loading={loading['custom-save']}
                                />
                            </div>
                        </FormActions>
                    </div>
                </CardContent>
            </Card>

            {/* Button Sizes */}
            <Card>
                <CardHeader>
                    <CardTitle>Button Sizes</CardTitle>
                    <CardDescription>
                        All buttons support different sizes: sm, default, lg, xl.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Small</p>
                            <SaveButton size="sm" onClick={() => console.log('Small')} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Default</p>
                            <SaveButton onClick={() => console.log('Default')} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Large</p>
                            <SaveButton size="lg" onClick={() => console.log('Large')} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Extra Large</p>
                            <SaveButton size="xl" onClick={() => console.log('XL')} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Example */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Example</CardTitle>
                    <CardDescription>
                        A realistic form example using standardized buttons.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleClick('example-form');
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Enter your email"
                            />
                        </div>

                        <FormActions
                            onCancel={() => console.log('Cancel form')}
                            submitText="Save Profile"
                            isSubmitting={loading['example-form']}
                            submitLoadingText="Saving profile..."
                        />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
