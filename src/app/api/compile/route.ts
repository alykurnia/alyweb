import { NextRequest, NextResponse } from 'next/server';
import { CompilerService } from '@/lib/compiler/compilerService';
import { ProjectFile } from '@/lib/compiler/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files, boardId } = body as { files?: ProjectFile[]; boardId?: string };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          backendAvailable: false,
          status: 'error',
          output: 'No sketch files provided in compilation request.',
          diagnostics: [],
          executionReady: false,
        },
        { status: 400 }
      );
    }

    const result = await CompilerService.compile(files, boardId || 'esp32-devkit');
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal compilation server error';
    return NextResponse.json(
      {
        success: false,
        backendAvailable: false,
        status: 'error',
        output: `Server error during compilation: ${message}`,
        diagnostics: [],
        executionReady: false,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const toolchain = await CompilerService.checkToolchainAvailability();
  return NextResponse.json(toolchain);
}
