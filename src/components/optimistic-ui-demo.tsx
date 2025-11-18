'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useOptimisticUpdate } from '@/lib/interaction-optimization';
import { Loader2, Check, X } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast';

/**
 * Demo component showing optimistic UI updates
 * 
 * This demonstrates how to implement optimistic updates that respond
 * immediately to user actions while the actual operation completes in the background.
 */

interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
}

export function OptimisticUIDemo() {
    const [todos, setTodos] = React.useState<TodoItem[]>([
        { id: '1', text: 'Learn about optimistic UI', completed: false },
        { id: '2', text: 'Implement fast interactions', completed: false },
    ]);
    const [newTodoText, setNewTodoText] = React.useState('');

    // Simulate API delay
    const simulateApiCall = (delay: number = 1000) => {
        return new Promise((resolve) => setTimeout(resolve, delay));
    };

    // Add todo with optimistic update
    const handleAddTodo = async () => {
        if (!newTodoText.trim()) return;

        const newTodo: TodoItem = {
            id: Date.now().toString(),
            text: newTodoText,
            completed: false,
        };

        // Optimistic update - UI responds immediately
        setTodos((current) => [...current, newTodo]);
        setNewTodoText('');

        try {
            // Simulate API call
            await simulateApiCall(1500);
            showSuccessToast('Todo added successfully!');
        } catch (error) {
            // Revert on error
            setTodos((current) => current.filter((t) => t.id !== newTodo.id));
            showErrorToast('Failed to add todo');
        }
    };

    // Toggle todo with optimistic update
    const handleToggleTodo = async (id: string) => {
        // Optimistic update - UI responds immediately
        setTodos((current) =>
            current.map((todo) =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );

        try {
            // Simulate API call
            await simulateApiCall(1000);
        } catch (error) {
            // Revert on error
            setTodos((current) =>
                current.map((todo) =>
                    todo.id === id ? { ...todo, completed: !todo.completed } : todo
                )
            );
            showErrorToast('Failed to update todo');
        }
    };

    // Delete todo with optimistic update
    const handleDeleteTodo = async (id: string) => {
        const todoToDelete = todos.find((t) => t.id === id);
        if (!todoToDelete) return;

        // Optimistic update - UI responds immediately
        setTodos((current) => current.filter((t) => t.id !== id));

        try {
            // Simulate API call
            await simulateApiCall(1000);
            showSuccessToast('Todo deleted');
        } catch (error) {
            // Revert on error
            setTodos((current) => [...current, todoToDelete]);
            showErrorToast('Failed to delete todo');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Optimistic UI Demo</CardTitle>
                <CardDescription>
                    Notice how the UI responds immediately to your actions, even though
                    there's a simulated 1-1.5 second API delay. This is optimistic UI in action!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Todo Form */}
                <div className="flex gap-2">
                    <Input
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        placeholder="Add a new todo..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddTodo();
                            }
                        }}
                    />
                    <Button onClick={handleAddTodo} disabled={!newTodoText.trim()}>
                        Add
                    </Button>
                </div>

                {/* Todo List */}
                <div className="space-y-2">
                    {todos.map((todo) => (
                        <div
                            key={todo.id}
                            className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleTodo(todo.id)}
                                className="h-8 w-8"
                            >
                                {todo.completed ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <div className="h-4 w-4 rounded border-2 border-muted-foreground" />
                                )}
                            </Button>
                            <span
                                className={`flex-1 ${todo.completed
                                        ? 'line-through text-muted-foreground'
                                        : 'text-foreground'
                                    }`}
                            >
                                {todo.text}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {todos.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No todos yet. Add one above!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
