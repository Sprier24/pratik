import { NextResponse } from 'next/server';

export async function GET() {
    try {
        return NextResponse.json(
            { error: 'Backend API not implemented yet' },
            { status: 501 }
        );
    } catch (error) {
        console.error('Error fetching certificates:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
