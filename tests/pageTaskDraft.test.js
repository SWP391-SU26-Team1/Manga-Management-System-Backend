const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

// Mock dependencies
const pageTasksRepo = require('../src/modules/pageTasks/pageTasks.repository');
const pageTaskDraftRepo = require('../src/modules/pageTaskDraft/pageTaskDraft.repository');

jest.mock('../src/modules/pageTasks/pageTasks.repository');
jest.mock('../src/modules/pageTaskDraft/pageTaskDraft.repository');

describe('Page Task Draft Workflow', () => {
  let assistantToken;
  let otherAssistantToken;
  const mockTaskId = '11111111-1111-4111-8111-111111111111';
  const mockUserId = '22222222-2222-4222-8222-222222222222';
  const mockOtherUserId = '33333333-3333-4333-8333-333333333333';

  beforeAll(() => {
    assistantToken = jwt.sign(
      { user_id: mockUserId, email: 'assistant@test.com', role: 'assistant' },
      process.env.JWT_SECRET || 'test-secret-do-not-use-in-prod'
    );
    otherAssistantToken = jwt.sign(
      { user_id: mockOtherUserId, email: 'other@test.com', role: 'assistant' },
      process.env.JWT_SECRET || 'test-secret-do-not-use-in-prod'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/page-tasks/:taskId/draft', () => {
    it('returns 404 if page task does not exist', async () => {
      pageTasksRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/page-tasks/${mockTaskId}/draft`)
        .set('Authorization', `Bearer ${assistantToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Page task not found');
    });

    it('returns 403 if assistant is not assigned to the task', async () => {
      pageTasksRepo.findById.mockResolvedValue({
        task_id: mockTaskId,
        assistant_id: mockOtherUserId,
      });

      const res = await request(app)
        .get(`/api/page-tasks/${mockTaskId}/draft`)
        .set('Authorization', `Bearer ${assistantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('returns null if draft does not exist', async () => {
      pageTasksRepo.findById.mockResolvedValue({
        task_id: mockTaskId,
        assistant_id: mockUserId,
      });
      pageTaskDraftRepo.findByTaskAndUser.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/page-tasks/${mockTaskId}/draft`)
        .set('Authorization', `Bearer ${assistantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('returns draft details formatted in camelCase if it exists', async () => {
      pageTasksRepo.findById.mockResolvedValue({
        task_id: mockTaskId,
        assistant_id: mockUserId,
      });
      pageTaskDraftRepo.findByTaskAndUser.mockResolvedValue({
        draft_id: 'd1',
        task_id: mockTaskId,
        user_id: mockUserId,
        image_url: 'https://preview.url',
        canvas_state: { layers: [] },
      });

      const res = await request(app)
        .get(`/api/page-tasks/${mockTaskId}/draft`)
        .set('Authorization', `Bearer ${assistantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        draftId: 'd1',
        taskId: mockTaskId,
        imageUrl: 'https://preview.url',
        canvasState: { layers: [] },
      });
    });
  });

  describe('PUT /api/page-tasks/:taskId/draft', () => {
    it('successfully upserts draft and returns camelCase data', async () => {
      pageTasksRepo.findById.mockResolvedValue({
        task_id: mockTaskId,
        assistant_id: mockUserId,
      });
      pageTaskDraftRepo.upsertDraft.mockResolvedValue({
        draft_id: 'd1',
        task_id: mockTaskId,
        user_id: mockUserId,
        image_url: 'https://preview-updated.url',
        canvas_state: { layers: ['layer1'] },
      });

      const res = await request(app)
        .put(`/api/page-tasks/${mockTaskId}/draft`)
        .set('Authorization', `Bearer ${assistantToken}`)
        .send({
          imageUrl: 'https://preview-updated.url',
          canvasState: { layers: ['layer1'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        draftId: 'd1',
        taskId: mockTaskId,
        imageUrl: 'https://preview-updated.url',
        canvasState: { layers: ['layer1'] },
      });
      expect(pageTaskDraftRepo.upsertDraft).toHaveBeenCalledWith(
        mockTaskId,
        mockUserId,
        {
          imageUrl: 'https://preview-updated.url',
          canvasState: { layers: ['layer1'] },
        }
      );
    });
  });

  describe('DELETE /api/page-tasks/:taskId/draft', () => {
    it('successfully deletes the draft', async () => {
      pageTasksRepo.findById.mockResolvedValue({
        task_id: mockTaskId,
        assistant_id: mockUserId,
      });
      pageTaskDraftRepo.deleteDraft.mockResolvedValue();

      const res = await request(app)
        .delete(`/api/page-tasks/${mockTaskId}/draft`)
        .set('Authorization', `Bearer ${assistantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(pageTaskDraftRepo.deleteDraft).toHaveBeenCalledWith(mockTaskId, mockUserId);
    });
  });
});
