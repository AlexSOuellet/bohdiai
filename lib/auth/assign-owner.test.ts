import { describe, it, expect, vi, beforeEach } from 'vitest';

const addShopOwnerMock = vi.fn();
vi.mock('./membership', () => ({
  addShopOwner: (userId: string, tenantId: string) => addShopOwnerMock(userId, tenantId),
}));

const loggerErrorMock = vi.fn();
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: (...args: unknown[]) => loggerErrorMock(...args) },
}));

import { assignShopOwner } from './assign-owner';

const USER = 'user-1';
const TENANT = 'tenant-1';

beforeEach(() => {
  addShopOwnerMock.mockReset();
  addShopOwnerMock.mockResolvedValue(undefined);
  loggerErrorMock.mockReset();
});

describe('assignShopOwner', () => {
  it('links the maker as owner of the freshly built tenant', async () => {
    await assignShopOwner(USER, TENANT);
    expect(addShopOwnerMock).toHaveBeenCalledWith(USER, TENANT);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('logs loudly and skips the write when there is no signed-in maker', async () => {
    await assignShopOwner(null, TENANT);
    expect(addShopOwnerMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalled();
  });

  it('logs but does not throw when the ownership write fails', async () => {
    addShopOwnerMock.mockRejectedValue(new Error('insert failed'));
    await expect(assignShopOwner(USER, TENANT)).resolves.toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalled();
  });

  it('logs without throwing when the write rejects with a non-Error value', async () => {
    addShopOwnerMock.mockRejectedValue('string failure');
    await expect(assignShopOwner(USER, TENANT)).resolves.toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
