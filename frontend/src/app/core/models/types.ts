import { Role } from './user.model';
import { OperationType } from './stock-operation.model';

export const roleLabelKey: Record<Role, string> = {
    SUPER_ADMIN: 'role.superAdmin',
    ADMIN: 'role.admin',
    SELLER: 'role.seller',
    COMPTA: 'role.compta',
};

export const operationTypeLabelKey: Record<OperationType, string> = {
    REGISTRATION: 'operationType.registration',
    SALE: 'operationType.sale',
    ADJUSTMENT: 'operationType.adjustment',
};

// export type Sort = { active: string; direction: string };
export type Sort = { active: string; direction: 'asc' | 'desc' | '' };
