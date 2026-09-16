export interface Category {
    id: string;
    name: string;
    prefix: string;
    description: string | null;
}

export interface CategoryRequest {
    name: string;
    prefix: string;
    description?: string;
    userId: string;
}
