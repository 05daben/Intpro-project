export interface ServiceRequest {
    id?: number;
    type: string;
    items: any;
    status: string;
    date: string;
    employeeEmail?: string;
    isDeleting?: boolean; // dynamic UI property
}
