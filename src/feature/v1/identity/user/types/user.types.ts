export interface GetUserData {
    id: string;
}

export interface UpdateUserData {
    id: string;
    username: string;
    password: string;
}

export interface UpdatePasswordData {
    id: string;
    currentPassword: string;
    newPassword: string;
}
