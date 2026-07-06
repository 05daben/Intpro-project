export interface AdminStats {
    accountsCount: number;
    deptsCount: number;
    empsCount: number;
    pendingReqsCount: number;
}

export interface UserStats {
    totalRequests: number;
    pendingCount: number;
    approvedCount: number;
}
