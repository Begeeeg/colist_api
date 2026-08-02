export interface GetUserData {
    id: string;
}

export interface UpdateUsernameData {
    id: string;
    username: string;
    password: string;
}

export interface UpdatePasswordData {
    id: string;
    currentPassword: string;
    newPassword: string;
}

export interface SearchUsersData {
    query: string;
}

export interface DeleteUserData {
    id: string;
    password: string;
}
