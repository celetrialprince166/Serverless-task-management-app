
import { handler as createTaskHandler } from '../../src/handlers/tasks/create';
import { handler as listTasksHandler } from '../../src/handlers/tasks/list';
import { handler as updateTaskHandler } from '../../src/handlers/tasks/update';
import { createMockAuthEvent, createMockUnauthEvent } from '../helpers';
import { TABLES, putItem, queryItems, scanItems, batchGet } from '../../src/lib/dynamodb';
import { Context } from 'aws-lambda';

// Mock DynamoDB but KEEP middleware real
jest.mock('../../src/lib/dynamodb', () => ({
    TABLES: {
        TASKS: 'tasks',
        USERS: 'users',
    },
    putItem: jest.fn(),
    getItem: jest.fn(),
    queryItems: jest.fn(),
    scanItems: jest.fn(), // Mock scanItems
    batchGet: jest.fn(), // Mock batchGet for list tasks
    updateItem: jest.fn(),
}));

jest.mock('../../src/lib/logger', () => {
    return {
        Logger: jest.fn().mockImplementation(() => ({
            setRequestId: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        })),
    };
});

describe('Auth Integration Tests (Real Middleware)', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Unauthenticated Access', () => {
        it('should return 401 when no credentials provided', async () => {
            const event = createMockUnauthEvent({});
            const result = await createTaskHandler(event, mockContext);
            expect(result.statusCode).toBe(401);
            expect(JSON.parse(result.body).message).toContain('Authentication required');
        });
    });

    describe('RBAC: Admin Only Handlers', () => {
        it('should return 403 when Member tries to Create Task', async () => {
            // Member role
            const event = createMockAuthEvent({ title: 'Test' }, null, 'member');

            const result = await createTaskHandler(event, mockContext);

            expect(result.statusCode).toBe(403);
            expect(JSON.parse(result.body).error).toBe('Forbidden');
        });

        it('should allow Admin to Create Task', async () => {
            // Admin role
            const event = createMockAuthEvent({ title: 'Test', priority: 'LOW' }, null, 'admin');
            (putItem as jest.Mock).mockResolvedValue({});

            const result = await createTaskHandler(event, mockContext);

            expect(result.statusCode).toBe(201);
            expect(putItem).toHaveBeenCalled();
        });
    });

    describe('RBAC: Data Filtering (List Tasks)', () => {
        it('should return ALL tasks for Admin', async () => {
            const event = createMockAuthEvent(null, null, 'admin');

            const mockTask = {
                id: '1', title: 'Task 1', description: 'Desc', status: 'OPEN', priority: 'MEDIUM',
                createdById: 'user-1', createdByName: 'User 1', createdByEmail: 'u1@e.com',
                createdAt: '2023-01-01', updatedAt: '2023-01-01', dueDate: '2023-02-01'
            };

            (scanItems as jest.Mock).mockResolvedValue([mockTask, { ...mockTask, id: '2' }]);

            const result = await listTasksHandler(event, mockContext);

            if (result.statusCode !== 200) {
                console.log('Admin List Failed:', result.body);
            }

            expect(result.statusCode).toBe(200);
            expect(scanItems).toHaveBeenCalledWith(expect.objectContaining({
                TableName: TABLES.TASKS,
                FilterExpression: 'SK = :metadata'
            }));
        });

        it('should return ONLY assigned tasks for Member', async () => {
            const event = createMockAuthEvent(null, null, 'member', 'user-123');

            // Mock the two-step member list: 1. Query Assignments, 2. BatchGet Tasks
            (queryItems as jest.Mock).mockResolvedValue([
                { taskId: 'task-1' }, { taskId: 'task-2' }
            ]);

            const mockTask1 = {
                id: 'task-1', title: 'Task 1', description: 'Desc', status: 'OPEN', priority: 'MEDIUM',
                createdById: 'user-1', createdByName: 'User 1', createdByEmail: 'u1@e.com',
                createdAt: '2023-01-01', updatedAt: '2023-01-01', dueDate: '2023-02-01'
            };

            (batchGet as jest.Mock).mockResolvedValue([
                mockTask1, { ...mockTask1, id: 'task-2' }
            ]);

            const result = await listTasksHandler(event, mockContext);

            if (result.statusCode !== 200) {
                console.log('Member List Failed:', result.body);
            }

            expect(result.statusCode).toBe(200);

            // Verify it queried GSI2 for assignments specific to this user
            expect(queryItems).toHaveBeenCalledWith(expect.objectContaining({
                TableName: TABLES.TASKS,
                IndexName: 'GSI2',
                KeyConditionExpression: 'GSI2PK = :userId',
                ExpressionAttributeValues: expect.objectContaining({
                    ':userId': 'USER#user-123'
                })
            }));
        });
    });

    describe('RBAC: Granular Permissions (Update Status)', () => {
        it('should return 403 when Member tries to update full task details', async () => {
            const jsCodeBody = { title: 'Hacked Title' }; // Member trying to change title
            const event = createMockAuthEvent(jsCodeBody, { taskId: 'task-1' }, 'member', 'user-123');

            // Update handler usually fetches task first to check assignment
            // We need to mock getItem to return a task assigned to this user
            // If the handler logic relies on 'isAssignedOrAdmin' helper which might fetch data
            // Let's assume for this integration test failure that it blocks based on payload keys if configured,
            // OR checks role.

            const result = await updateTaskHandler(event, mockContext);

            // Ideally should fail because Members can ONLY update status
            // If update.ts logic is correct
            expect(result.statusCode).toBe(403);
        });
    });
});
