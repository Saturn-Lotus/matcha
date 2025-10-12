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

    const userService = getUserService();
    userService.createUserProfile(id, data);

    return NextResponse.json(id);
  },
);

export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    // const userService = getUserService();

    // extract form data

    // validate form data

    // upload images

    // update user profile

    // return updated profile

    return NextResponse.json(id);
  },
);
