import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getAuthService, getUserService } from '@/server/factories';
import {
  CreateUserProfileSchema,
  UpdateUserProfileSchema,
} from '@/server/schemas';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const userService = await getUserService();
    const profile = await userService.getProfileByUserId(id);
    return NextResponse.json(profile);
  },
);

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;

    const formData = await request.formData();
    const rawProfileData = {
      ...Object.fromEntries(formData.entries()),
      interests: formData.getAll('interests'),
      pictures: formData.getAll('pictures'),
    };

    const data = CreateUserProfileSchema.parse(rawProfileData);

    const userService = await getUserService();
    const profile = await userService.createUserProfile(id, data);

    const cookieStore = await cookies();
    const currentToken = cookieStore.get('session')?.value!;
    const authService = getAuthService();
    const newSession = await authService.refreshSession(currentToken, { isProfileComplete: true, avatarUrl: profile.avatarUrl ?? null });
    cookieStore.set('session', newSession);

    return NextResponse.json(profile, { status: 201 });
  },
);

export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;

    const formData = await request.formData();
    const rawData = {
      ...Object.fromEntries(formData.entries()),
      interests: formData.getAll('interests'),
      newPictures: formData.getAll('newPictures'),
      picturesToRemove: formData.getAll('picturesToRemove'),
    };
    const data = UpdateUserProfileSchema.parse(rawData);

    const userService = await getUserService();
    const profile = await userService.updateUserProfile(id, data);
    return NextResponse.json(profile, { status: 200 });
  },
);
