import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        {
          error: "messageId parameter is required",
        },
        { status: 400 }
      );
    }

    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        {
          error: "Brevo API key not configured",
        },
        { status: 500 }
      );
    }

    console.log("Checking email status for messageId:", messageId);

    const response = await fetch(
      `https://api.brevo.com/v3/smtp/statistics/events?messageId=${messageId}`,
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error("Brevo API error:", response.status, response.statusText);
      return NextResponse.json(
        {
          error: `Brevo API error: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Brevo API response:", data);

    return NextResponse.json({
      success: true,
      messageId,
      events: data.events || [],
      count: data.count || 0,
    });
  } catch (error) {
    console.error("Email status check error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get account information
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        {
          error: "Brevo API key not configured",
        },
        { status: 500 }
      );
    }

    if (action === "account-info") {
      const response = await fetch("https://api.brevo.com/v3/account", {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Brevo API error: ${response.statusText}`,
          },
          { status: response.status }
        );
      }

      const accountData = await response.json();

      return NextResponse.json({
        success: true,
        account: {
          email: accountData.email,
          firstName: accountData.firstName,
          lastName: accountData.lastName,
          companyName: accountData.companyName,
          plan: accountData.plan?.[0]?.type || "Unknown",
          emailCredits: accountData.plan?.[0]?.credits || 0,
          emailCreditsUsed: accountData.plan?.[0]?.creditsUsed || 0,
        },
      });
    }

    if (action === "email-stats") {
      const response = await fetch(
        "https://api.brevo.com/v3/smtp/statistics/aggregatedReport",
        {
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Brevo API error: ${response.statusText}`,
          },
          { status: response.status }
        );
      }

      const statsData = await response.json();

      return NextResponse.json({
        success: true,
        stats: statsData,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid action. Use: account-info or email-stats",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Brevo API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
