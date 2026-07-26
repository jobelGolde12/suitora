import { NextRequest, NextResponse } from "next/server";
import { getTrendItemById, listTrendItems } from "@/lib/db/queries";
import { rowToTrendItem } from "@/lib/trend/normalize";
import { rankTrendItems } from "@/lib/trend/ranking";

/**
 * GET /api/trending/[id]
 * Returns a single TrendItem plus similar items in the same category.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const row = await getTrendItemById(id);
    if (!row) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const item = rowToTrendItem(row);

    const similarRows = await listTrendItems({
      limit: 8,
      category: item.category,
    });

    const similar = rankTrendItems(
      similarRows.map(rowToTrendItem).filter((s) => s.id !== item.id)
    ).slice(0, 4);

    return NextResponse.json({ item, similar });
  } catch (err) {
    console.error("Error in GET /api/trending/[id]:", err);
    return NextResponse.json(
      { error: "Failed to load trending item" },
      { status: 500 }
    );
  }
}
