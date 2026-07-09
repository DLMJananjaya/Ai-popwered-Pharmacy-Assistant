import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import BillingRecord from '@/models/BillingRecord';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Always scope to the currently signed-in user
    let query: any = { userId: session.user.id };
    
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    const records = await BillingRecord.find(query)
      .sort({ createdAt: -1 })
      .lean();

    let totalSalesAmt = 0;
    let prescriptionCount = 0;

    const formattedRecords = records.map((r: any) => {
      const amount = r.amountPayable !== undefined ? r.amountPayable : (r.total || 0);
      const paymentMethodLower = (r.paymentMethod || '').toLowerCase();
      
      const hasPrescriptionMedication = r.items?.some((item: any) => {
        const name = (item.name || '').toLowerCase();
        return name.includes('barlen') || name.includes('yescort') || name.includes('celcoxx');
      });

      
      if (
        amount === 0 || 
        paymentMethodLower.includes('prescription') || 
        paymentMethodLower.includes('scan') ||
        hasPrescriptionMedication
      ) {
        prescriptionCount++;
      } else {
        totalSalesAmt += amount;
      }

      return {
        id: r._id?.toString() || '',
        items: r.items || [],
        amountPayable: amount,
        paymentMethod: r.paymentMethod || 'cash',
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({
      summary: {
        noOfSales: records.length,
        prescriptionReads: prescriptionCount,
        totalSales: `Rs. ${totalSalesAmt.toFixed(2)}`,
        revenue: `Rs. ${(totalSalesAmt * 0.15).toFixed(2)}`,
      },
      records: formattedRecords
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}