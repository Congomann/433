import { db } from '../db';
import { User, UserRole } from '../../types';

export const updateMyProfile = async (userId: number, updates: Partial<User>) => {
    // 1. Update the user record
    const updatedUser = await db.users.update(userId, updates);
    if (!updatedUser) {
        throw { status: 404, message: "User not found." };
    }

    // 2. If the user is an agent or sub-admin, sync changes to the agent record
    if (updatedUser.role === UserRole.AGENT || updatedUser.role === UserRole.SUB_ADMIN) {
        const agent = await db.agents.findById(userId);
        if (agent) {
            await db.agents.update(userId, {
                name: updatedUser.name,
                avatar: updatedUser.avatar,
            });
        }
    }
    
    const { password, ...userResponse } = updatedUser;
    return userResponse;
};
