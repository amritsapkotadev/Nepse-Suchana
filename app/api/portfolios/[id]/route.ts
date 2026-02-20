import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPortfolio, deletePortfolio, updatePortfolio } from '@/lib/services/portfolio';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    const { id } = await params;
    const portfolio = await getPortfolio(user.id, parseInt(id));
    return NextResponse.json({ success: true, data: portfolio });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    const { id } = await params;
    const { name, description, initial_balance } = await req.json();
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (initial_balance !== undefined) updates.initial_balance = parseFloat(initial_balance) || 0;
    
    const updatedPortfolio = await updatePortfolio(user.id, parseInt(id), updates);
    
    return NextResponse.json({ success: true, data: updatedPortfolio });
  } catch (error: any) {
    const status = error.message === 'Portfolio name already exists' ? 400 : 404;
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    const { id } = await params;
    await deletePortfolio(user.id, parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}
