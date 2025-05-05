import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import mysql.connector
from tkcalendar import DateEntry

class BuyFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master)

        # Connect to the database
        self.connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root123',
            database='dailywages sunday',
        )
        self.cursor = self.connection.cursor()

        # Create the Buys table if it doesn't exist
        create_table_query = """
        CREATE TABLE IF NOT EXISTS Buy (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            amount DECIMAL(10, 2) NOT NULL,
            quantity INT DEFAULT 1,
            gst_rate DECIMAL(5, 2) DEFAULT 0.0,
            total DECIMAL(10, 2) NOT NULL,
            payment_method VARCHAR(50),
            transection_date DATE NOT NULL
        )
        """
        self.cursor.execute(create_table_query)
        self.connection.commit()

        self.setup_ui()
        self.load_records()

    def setup_ui(self):
        self.master.title("Buy Manager")
        self.master.geometry("1000x700")

        main_frame = tk.Frame(self, padx=10, pady=10)
        main_frame.pack(fill=tk.BOTH, expand=True)

        tk.Label(main_frame, text="Name").grid(row=0, column=0, padx=5, pady=5)
        self.name_entry = tk.Entry(main_frame, width=50)
        self.name_entry.grid(row=0, column=1, padx=5, pady=5)

        tk.Label(main_frame, text="Description").grid(row=1, column=0, padx=5, pady=5)
        self.description_entry = tk.Entry(main_frame, width=50)
        self.description_entry.grid(row=1, column=1, padx=5, pady=5)

        tk.Label(main_frame, text="Quantity").grid(row=2, column=0, padx=5, pady=5)
        self.quantity_entry = tk.Entry(main_frame, width=50)
        self.quantity_entry.grid(row=2, column=1, padx=5, pady=5)

        tk.Label(main_frame, text="Amount").grid(row=3, column=0, padx=5, pady=5)
        self.amount_entry = tk.Entry(main_frame, width=50)
        self.amount_entry.grid(row=3, column=1, padx=5, pady=5)

        tk.Label(main_frame, text="GST Rate (%)").grid(row=4, column=0, padx=5, pady=5)
        self.gst_entry = tk.Entry(main_frame, width=50)
        self.gst_entry.grid(row=4, column=1, padx=5, pady=5)

        tk.Label(main_frame, text="Total").grid(row=5, column=0, padx=5, pady=5)
        self.total_entry = tk.Entry(main_frame, width=50)
        self.total_entry.grid(row=5, column=1, padx=5, pady=5)

        tk.Label(main_frame, text="Payment Method").grid(row=5, column=0, padx=5, pady=5)
        self.payment_var = tk.StringVar()
        self.payment_entry = ttk.Combobox(main_frame, width=47, textvariable=self.payment_var, state="readonly")
        self.payment_entry['values'] = ["Cash", "Credit"]
        self.payment_entry.grid(row=5, column=1, padx=5, pady=5)

        tk.Label(main_frame, text="Date").grid(row=6, column=0, padx=5, pady=5)
        self.date_entry = DateEntry(main_frame, width=48, background='darkblue', foreground='white', borderwidth=2, date_pattern='dd/mm/yyyy')
        self.date_entry.grid(row=6, column=1, padx=5, pady=5)

        submit_button = tk.Button(main_frame, text="Submit", command=self.submit, width=15)
        submit_button.grid(row=7, column=1, pady=10)

        # Filter Section
        filter_frame = tk.Frame(self, padx=10, pady=10)
        filter_frame.pack(fill=tk.X)

        tk.Label(filter_frame, text="Filter by Month").pack(side=tk.LEFT, padx=5)
        self.month_var = tk.StringVar()
        month_dropdown = ttk.Combobox(filter_frame, width=20, textvariable=self.month_var, values=[
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ])
        month_dropdown.pack(side=tk.LEFT, padx=5)

        tk.Label(filter_frame, text="Year").pack(side=tk.LEFT, padx=5)
        self.year_entry = tk.Entry(filter_frame, width=20)
        self.year_entry.pack(side=tk.LEFT, padx=5)

        show_button = tk.Button(filter_frame, text="Show", command=self.filter_by_date, width=15)
        show_button.pack(side=tk.LEFT, padx=5)

        clear_filter_button = tk.Button(filter_frame, text="Clear Filter", command=self.clear_filter, width=15)
        clear_filter_button.pack(side=tk.LEFT, padx=5)

        # Table Section
        table_frame = tk.Frame(self)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.table = ttk.Treeview(table_frame, columns=("Name", "Description", "Quantity", "Amount", "GST", "Total", "Payment", "Date"), show='headings')
        for col in self.table["columns"]:
            self.table.heading(col, text=col)
        self.table.pack(fill=tk.BOTH, expand=True)

        self.table.bind("<Double-1>", self.on_item_double_click)

        edit_button = tk.Button(table_frame, text="Edit", command=self.edit, width=10)
        edit_button.pack(side=tk.LEFT, padx=10, pady=10)

        delete_button = tk.Button(table_frame, text="Delete", command=self.delete, width=10)
        delete_button.pack(side=tk.LEFT, padx=10, pady=10)

        self.filtered_total_label = tk.Label(table_frame, text="Filtered Total Amount: 0.00")
        self.filtered_total_label.pack(side=tk.LEFT, padx=5)

    def submit(self):
        name = self.name_entry.get()
        description = self.description_entry.get()
        quantity = self.quantity_entry.get()
        amount = self.amount_entry.get()
        gst_rate = self.gst_entry.get()
        payment_method = self.payment_var.get()
        date = self.date_entry.get()
    
        if not all([name, description, quantity, amount, gst_rate, payment_method, date]):
            messagebox.showwarning("Input Error", "Please fill all fields")
            return
    
        try:
            quantity = int(quantity)
            amount = float(amount.replace(',', ''))  # Remove commas from amount if any
            gst_rate = float(gst_rate)
            # Calculate total before GST
            total_before_gst = amount * quantity
            # Calculate GST
            gst_amount = (gst_rate / 100) * total_before_gst
            # Calculate total after GST
            total = total_before_gst + gst_amount
            date = datetime.strptime(date, "%d/%m/%Y").date()
        except ValueError:
            messagebox.showwarning("Input Error", "Check input formats (Quantity: int, Amount & GST: float)")
            return
    
        query = """
        INSERT INTO Buy (name, description, quantity, amount, gst_rate, total, payment_method, transection_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (name, description, quantity, amount, gst_rate, total, payment_method, date)
        print(f"Insert values: {values}")  # Debugging line to see what data is being inserted
        self.cursor.execute(query, values)
        self.connection.commit()
    
        self.load_records()
        self.clear_entries()

    def load_records(self):
        query = "SELECT id, name, description, quantity, amount, gst_rate, total, payment_method, transection_date FROM Buy"
        self.cursor.execute(query)
        rows = self.cursor.fetchall()
        print(f"Fetched rows: {rows}")  # Debugging line to see fetched data
        records = [(row[1], row[2], row[3], row[4], row[5], row[6], row[7]) for row in rows]
        self.update_table(records)

    def update_table(self, records):
        print(f"Updating table with records: {records}")  # Debugging line to check the records passed to the table
        self.table.delete(*self.table.get_children())
        for record in records:
            self.table.insert("", tk.END, values=(
                record[0],  # Name
                record[1],  # Description
                record[2],  # Quantity
                f"{record[3]:,.2f}",  # Amount
                f"{record[4]:,.2f}%",  # GST Rate
                f"{record[5]:,.2f}",  # Total
                record[6],  # Payment Method
                record[7].strftime("%d/%m/%Y")  # Date
            ))
        self.update_filtered_total(records)

    def update_filtered_total(self, records):
        filtered_total = sum(float(record[3]) for record in records)
        self.filtered_total_label.config(text=f"Filtered Total Amount: {filtered_total:,.2f}")

    def filter_by_date(self):
        month = self.month_var.get()
        year = self.year_entry.get()

        if not month or not year:
            messagebox.showwarning("Input Error", "Please select a month and enter a year")
            return

        try:
            year = int(year)
            month_number = datetime.strptime(month, "%B").month
        except ValueError:
            messagebox.showwarning("Input Error", "Invalid month/year")
            return

        query = """
        SELECT id, name, description, quantity, amount, gst_rate, total, payment_method, transection_date 
        FROM Buy 
        WHERE MONTH(transection_date)=%s AND YEAR(transection_date)=%s
        """
        self.cursor.execute(query, (month_number, year))
        rows = self.cursor.fetchall()
        records = [(row[1], row[2], row[3], row[4], row[5], row[6], row[7]) for row in rows]
        self.update_table(records)

    def clear_filter(self):
        self.month_var.set("")
        self.year_entry.delete(0, tk.END)
        self.load_records()

    def on_item_double_click(self, event):
        selected_item = self.table.selection()
        if selected_item:
            item = self.table.item(selected_item)
            record = item["values"]

            self.name_entry.delete(0, tk.END)
            self.name_entry.insert(tk.END, record[0])
            self.description_entry.delete(0, tk.END)
            self.description_entry.insert(tk.END, record[1])
            self.quantity_entry.delete(0, tk.END)
            self.quantity_entry.insert(tk.END, record[2])
            self.amount_entry.delete(0, tk.END)
            self.amount_entry.insert(tk.END, record[3].replace(',', ''))
            self.gst_entry.delete(0, tk.END)
            self.gst_entry.insert(tk.END, record[4].replace('%', ''))
            self.total_entry.delete(0, tk.END)
            self.total_entry.insert(tk.END, record[5].replace(',', ''))
            self.payment_var.set("")

            self.selected_record_id = self.get_record_id(record)

    def edit(self):
        if not hasattr(self, 'selected_record_id'):
            messagebox.showwarning("Selection Error", "Please select a record to edit")
            return

        name = self.name_entry.get()
        description = self.description_entry.get()
        quantity = self.quantity_entry.get()
        amount = self.amount_entry.get()
        gst_rate = self.gst_entry.get()
        total = self.total_entry.get()
        payment_method = self.payment_var.get()
        date = self.date_entry.get()

        try:
            quantity = int(quantity)
            amount = float(amount.replace(',', ''))
            gst_rate = float(gst_rate)
            total = float(total.replace(',', ''))
            date = datetime.strptime(date, "%d/%m/%Y").date()
        except ValueError:
            messagebox.showwarning("Input Error", "Invalid input formats")
            return

        query = """
        UPDATE Buy SET name=%s, description=%s, quantity=%s, amount=%s, gst_rate=%s, total=%s, payment_method=%s, transection_date=%s 
        WHERE id=%s
        """
        values = (name, description, quantity, amount, gst_rate, total, payment_method, date, self.selected_record_id)
        self.cursor.execute(query, values)
        self.connection.commit()

        self.load_records()
        self.clear_entries()
        del self.selected_record_id

    def delete(self):
        selected_item = self.table.selection()
        if selected_item:
            item = self.table.item(selected_item)
            record = item["values"]
            record_id = self.get_record_id(record)

            confirm = messagebox.askyesno("Confirm Delete", "Are you sure you want to delete this record?")
            if confirm:
                query = "DELETE FROM Buy WHERE id=%s"
                self.cursor.execute(query, (record_id,))
                self.connection.commit()
                self.load_records()
                messagebox.showinfo("Success", "Record deleted successfully")

    def get_record_id(self, record):
        query = """
        SELECT id FROM Buy WHERE name=%s AND description=%s AND quantity=%s AND amount=%s AND gst_rate=%s AND total=%s AND payment_method=%s AND transection_date=%s
        """
        values = (
            record[0],
            record[1],
            int(record[2]),
            float(record[3].replace(',', '')),
            float(record[4].replace('%', '')),
            record[5],
            datetime.strptime(record[6], "%d/%m/%Y").date()
        )
        self.cursor.execute(query, values)
        row = self.cursor.fetchone()
        return row[0] if row else None

    def clear_entries(self):
        self.name_entry.delete(0, tk.END)
        self.description_entry.delete(0, tk.END)
        self.quantity_entry.delete(0, tk.END)
        self.amount_entry.delete(0, tk.END)
        self.gst_entry.delete(0, tk.END)
        self.total_entry.delete(0, tk.END)
        self.payment_var.set("")
        self.date_entry.delete(0, tk.END)

if __name__ == "__main__":
    root = tk.Tk()
    frame = BuyFrame(root)
    frame.pack(fill=tk.BOTH, expand=True)
    root.mainloop()
