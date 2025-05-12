import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from "uuid";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received body:", body);
    const requiredFields = [
      "certificateNo",
      "customerName",
      "siteLocation",
      "makeModel",
      "range",
      "serialNo",
      "calibrationGas",
      "gasCanisterDetails",
      "dateOfCalibration",
      "calibrationDueDate",
      "observations",
      "engineerName",
      "status",
    ];
    for (const field of requiredFields) {
      if (!(field in body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    const id = body.id || uuidv4();
    const result = await client.execute({
      sql: `INSERT INTO certificates (
        id, certificate_no, customer_name, site_location, make_model,
        range, serial_no, calibration_gas, gas_canister_details, date_of_calibration, 
        calibration_due_date, observations, engineer_name, status, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.certificateNo,
        body.customerName,
        body.siteLocation,
        body.makeModel,
        body.range,
        body.serialNo,
        body.calibrationGas,
        body.gasCanisterDetails,
        body.dateOfCalibration,
        body.calibrationDueDate,
        JSON.stringify(body.observations || []),
        body.engineerName,
        body.status,
        body.companyId || null,
      ],
    });
    console.log("Insert result:", result);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Error in creating certificate:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get("id");
    if (certificateId) {
      const result = await client.execute({
        sql: `SELECT * FROM certificates WHERE id = ?`,
        args: [certificateId],
      });
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Certificate not found" },
          { status: 404 }
        );
      }
      const certificate = result.rows[0];
      if (
        certificate.observations &&
        typeof certificate.observations === "string"
      ) {
        certificate.observations = JSON.parse(certificate.observations);
      }
      return NextResponse.json(certificate, { status: 200 });
    }
    const result = await client.execute({
      sql: `SELECT * FROM certificates`,
      args: [],
    });
    const certificates = result.rows.map((cert) => {
      if (cert.observations && typeof cert.observations === "string") {
        cert.observations = JSON.parse(cert.observations);
      }
      return cert;
    });
    return NextResponse.json(certificates, { status: 200 });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: "Valid certificate ID is required" },
        { status: 400 }
      );
    }
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { rows } = await client.execute({
      sql: `SELECT 1 FROM certificates WHERE id = ? LIMIT 1`,
      args: [id],
    });
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }
    const fieldsToUpdate = [];
    const values = [];
    const validFields = [
      "certificateNo",
      "customerName",
      "siteLocation",
      "makeModel",
      "range",
      "serialNo",
      "calibrationGas",
      "gasCanisterDetails",
      "dateOfCalibration",
      "calibrationDueDate",
      "observations",
      "engineerName",
      "status",
      "companyId",
    ];
    for (const field of validFields) {
      if (field in body) {
        let value = body[field];
        if (field === "observations" && value) {
          value = JSON.stringify(value);
        }
        if (value !== undefined) {
          fieldsToUpdate.push(`${snakeCase(field)} = ?`);
          values.push(value);
        }
      }
    }
    if (fieldsToUpdate.length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }
    values.push(id);
    const result = await client.execute({
      sql: `UPDATE certificates SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
      args: values,
    });
    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Certificate update failed - no changes made" },
        { status: 400 }
      );
    }
    const {
      rows: [updatedCert],
    } = await client.execute({
      sql: `SELECT * FROM certificates WHERE id = ?`,
      args: [id],
    });
    return NextResponse.json(
      {
        message: "Certificate updated successfully",
        data: formatCertificate(updatedCert),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT error:", error);
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "SQLITE_CONSTRAINT"
    ) {
      return NextResponse.json(
        { error: "Database constraint violation - check your data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function formatCertificate(cert: any) {
  if (cert.observations && typeof cert.observations === "string") {
    cert.observations = JSON.parse(cert.observations);
  }
  return cert;
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get("id");
    if (!certificateId) {
      return NextResponse.json(
        { error: "Certificate ID not provided" },
        { status: 400 }
      );
    }
    const checkResult = await client.execute({
      sql: `SELECT * FROM certificates WHERE id = ?`,
      args: [certificateId],
    });
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }
    await client.execute({
      sql: `DELETE FROM certificates WHERE id = ?`,
      args: [certificateId],
    });
    return NextResponse.json(
      { message: "Certificate deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
