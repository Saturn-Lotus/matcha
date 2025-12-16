import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { CreateUserProfileSchema } from '@/server/schemas';
import { NextRequest, NextResponse } from 'next/server';

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
    const data = CreateUserProfileSchema.parse(rawData);

    const userService = await getUserService();
    const profile = await userService.updateUserProfile(id, data);
    return NextResponse.json(profile, { status: 204 });
  },
);
