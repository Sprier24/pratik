import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received service body:", body);
    const requiredFields = [
      "id",
      "serviceId",
      "customerName",
      "customerLocation",
      "contactPerson",
      "contactNumber",
      "serviceEngineer",
      "date",
      "place",
      "placeOptions",
      "natureOfJob",
      "reportNo",
      "makeModelNumberoftheInstrumentQuantity",
      "serialNumberoftheInstrumentCalibratedOK",
      "serialNumberoftheFaultyNonWorkingInstruments",
      "engineerReport",
      "customerReport",
      "engineerRemarks",
      "engineerName",
    ];
    for (const field of requiredFields) {
      if (!(field in body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    await client.execute({
      sql: `INSERT INTO services (
        id, service_id, customer_name, customer_location, contact_person, contact_number,
        service_engineer, date, place, place_options, nature_of_job, report_no,
        make_model_number_of_the_instrument_quantity, serial_number_of_the_instrument_calibrated_ok,
        serial_number_of_the_faulty_non_working_instruments, engineer_report, customer_report,
        engineer_remarks, engineer_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        body.id,
        body.serviceId,
        body.customerName,
        body.customerLocation,
        body.contactPerson,
        body.contactNumber,
        body.serviceEngineer,
        body.date,
        body.place,
        body.placeOptions,
        body.natureOfJob,
        body.reportNo,
        body.makeModelNumberoftheInstrumentQuantity,
        body.serialNumberoftheInstrumentCalibratedOK,
        body.serialNumberoftheFaultyNonWorkingInstruments,
        body.engineerReport,
        body.customerReport,
        JSON.stringify(body.engineerRemarks),
        body.engineerName,
        body.status ?? "checked",
      ],
    });
    return NextResponse.json({ id: body.id }, { status: 201 });
  } catch (error) {
    console.error("POST /services error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("id");
    if (serviceId) {
      const result = await client.execute({
        sql: `SELECT * FROM services WHERE id = ?`,
        args: [serviceId],
      });
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result.rows[0], { status: 200 });
    }
    const all = await client.execute({
      sql: `SELECT * FROM services`,
      args: [],
    });
    return NextResponse.json(all.rows, { status: 200 });
  } catch (error) {
    console.error("GET /services error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const existing = await client.execute({
      sql: `SELECT * FROM services WHERE id = ?`,
      args: [id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    const current = existing.rows[0];
    await client.execute({
      sql: `UPDATE services SET
        service_id = ?, customer_name = ?, customer_location = ?, contact_person = ?, contact_number = ?,
        service_engineer = ?, date = ?, place = ?, place_options = ?, nature_of_job = ?, report_no = ?,
        make_model_number_of_the_instrument_quantity = ?, serial_number_of_the_instrument_calibrated_ok = ?,
        serial_number_of_the_faulty_non_working_instruments = ?, engineer_report = ?, customer_report = ?,
        engineer_remarks = ?, engineer_name = ?, status = ?
        WHERE id = ?`,
      args: [
        body.serviceId ?? current.service_id,
        body.customerName ?? current.customer_name,
        body.customerLocation ?? current.customer_location,
        body.contactPerson ?? current.contact_person,
        body.contactNumber ?? current.contact_number,
        body.serviceEngineer ?? current.service_engineer,
        body.date ?? current.date,
        body.place ?? current.place,
        body.placeOptions ?? current.place_options,
        body.natureOfJob ?? current.nature_of_job,
        body.reportNo ?? current.report_no,
        body.makeModelNumberoftheInstrumentQuantity ??
          current.make_model_number_of_the_instrument_quantity,
        body.serialNumberoftheInstrumentCalibratedOK ??
          current.serial_number_of_the_instrument_calibrated_ok,
        body.serialNumberoftheFaultyNonWorkingInstruments ??
          current.serial_number_of_the_faulty_non_working_instruments,
        body.engineerReport ?? current.engineer_report,
        body.customerReport ?? current.customer_report,
        body.engineerRemarks
          ? JSON.stringify(body.engineerRemarks)
          : current.engineer_remarks,
        body.engineerName ?? current.engineer_name,
        body.status ?? current.status,
        id,
      ],
    });
    return NextResponse.json(
      { message: "Service updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /services error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Service ID not provided" },
        { status: 400 }
      );
    }
    const check = await client.execute({
      sql: `SELECT * FROM services WHERE id = ?`,
      args: [id],
    });
    if (check.rows.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    await client.execute({
      sql: `DELETE FROM services WHERE id = ?`,
      args: [id],
    });
    return NextResponse.json(
      { message: "Service deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /services error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
