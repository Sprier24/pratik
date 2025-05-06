import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import mysql.connector
from tkcalendar import DateEntry

class BuyFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root123',
            database='dailywages sunday',
        )
        self.cursor = self.connection.cursor()
        self.cursor.execute("""
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
        """)
        self.connection.commit()
        self.setup_ui()
        self.load_records()

    def setup_ui(self):
        self.master.title("Hisab Kitab")
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
        tk.Button(filter_frame, text="Show", command=self.filter_by_date, width=15).pack(side=tk.LEFT, padx=5)
        tk.Button(filter_frame, text="Clear Filter", command=self.clear_filter, width=15).pack(side=tk.LEFT, padx=5)
        table_frame = tk.Frame(self)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.table = ttk.Treeview(
            table_frame,
            columns=("ID", "Name", "Description", "Quantity", "Amount", "GST", "Total", "Payment", "Date"),
            show='headings'
        )
        for col in self.table["columns"]:
            self.table.heading(col, text=col)
        self.table.column("ID", width=0, stretch=False)  # Hide ID
        self.table.pack(fill=tk.BOTH, expand=True)
        self.table.bind("<Double-1>", self.on_item_double_click)
        tk.Button(table_frame, text="Edit", command=self.edit, width=10).pack(side=tk.LEFT, padx=10, pady=10)
        tk.Button(table_frame, text="Delete", command=self.delete, width=10).pack(side=tk.LEFT, padx=10, pady=10)
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
            amount = float(amount.replace(',', ''))
            gst_rate = float(gst_rate)
            total_before_gst = amount * quantity
            gst_amount = (gst_rate / 100) * total_before_gst
            total = total_before_gst + gst_amount
            date = datetime.strptime(date, "%d/%m/%Y").date()
        except ValueError:
            messagebox.showwarning("Input Error", "Check number formats.")
            return
        self.cursor.execute("""
            INSERT INTO Buy (name, description, quantity, amount, gst_rate, total, payment_method, transection_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (name, description, quantity, amount, gst_rate, total, payment_method, date))
        self.connection.commit()
        self.load_records()
        self.clear_entries()

    def load_records(self):
        self.cursor.execute("SELECT id, name, description, quantity, amount, gst_rate, total, payment_method, transection_date FROM Buy")
        rows = self.cursor.fetchall()
        self.update_table(rows)

    def update_table(self, records):
        self.table.delete(*self.table.get_children())
        for row in records:
            self.table.insert("", tk.END, values=(
                row[0], row[1], row[2], row[3],
                f"{row[4]:,.2f}", f"{row[5]:.2f}%",
                f"{row[6]:,.2f}", row[7],
                row[8].strftime("%d/%m/%Y")
            ))
        self.update_filtered_total(records)

    def update_filtered_total(self, records):
        total = sum(row[6] for row in records)
        self.filtered_total_label.config(text=f"Filtered Total Amount: {total:,.2f}")

    def filter_by_date(self):
        month = self.month_var.get()
        year = self.year_entry.get()
        if not month or not year:
            messagebox.showwarning("Input Error", "Select month and year")
            return
        try:
            month_number = datetime.strptime(month, "%B").month
            year = int(year)
        except ValueError:
            messagebox.showwarning("Format Error", "Invalid month or year")
            return

        self.cursor.execute("""
            SELECT id, name, description, quantity, amount, gst_rate, total, payment_method, transection_date
            FROM Buy WHERE MONTH(transection_date) = %s AND YEAR(transection_date) = %s
        """, (month_number, year))
        self.update_table(self.cursor.fetchall())

    def clear_filter(self):
        self.month_var.set("")
        self.year_entry.delete(0, tk.END)
        self.load_records()

    def on_item_double_click(self, event):
        selected = self.table.selection()
        if selected:
            values = self.table.item(selected)["values"]
            self.selected_record_id = values[0]
            self.name_entry.delete(0, tk.END)
            self.name_entry.insert(0, values[1])
            self.description_entry.delete(0, tk.END)
            self.description_entry.insert(0, values[2])
            self.quantity_entry.delete(0, tk.END)
            self.quantity_entry.insert(0, values[3])
            self.amount_entry.delete(0, tk.END)
            self.amount_entry.insert(0, values[4].replace(',', ''))
            self.gst_entry.delete(0, tk.END)
            self.gst_entry.insert(0, values[5].replace('%', ''))
            self.payment_var.set(values[7])
            self.date_entry.set_date(datetime.strptime(values[8], "%d/%m/%Y"))

    def edit(self):
        if not hasattr(self, 'selected_record_id'):
            messagebox.showwarning("Selection Error", "Select a record first")
            return
        try:
            name = self.name_entry.get()
            description = self.description_entry.get()
            quantity = int(self.quantity_entry.get())
            amount = float(self.amount_entry.get().replace(',', ''))
            gst_rate = float(self.gst_entry.get())
            total = (amount * quantity) + (gst_rate / 100 * amount * quantity)
            payment_method = self.payment_var.get()
            date = datetime.strptime(self.date_entry.get(), "%d/%m/%Y").date()
        except ValueError:
            messagebox.showwarning("Input Error", "Check the input values")
            return
        self.cursor.execute("""
            UPDATE Buy SET name=%s, description=%s, quantity=%s, amount=%s, gst_rate=%s,
            total=%s, payment_method=%s, transection_date=%s WHERE id=%s
        """, (name, description, quantity, amount, gst_rate, total, payment_method, date, self.selected_record_id))
        self.connection.commit()
        self.load_records()
        self.clear_entries()
        del self.selected_record_id

    def delete(self):
        selected = self.table.selection()
        if selected:
            values = self.table.item(selected)["values"]
            record_id = values[0]
            confirm = messagebox.askyesno("Confirm", "Delete this record?")
            if confirm:
                self.cursor.execute("DELETE FROM Buy WHERE id=%s", (record_id,))
                self.connection.commit()
                self.load_records()
                messagebox.showinfo("Deleted", "Record deleted successfully")

    def clear_entries(self):
        self.name_entry.delete(0, tk.END)
        self.description_entry.delete(0, tk.END)
        self.quantity_entry.delete(0, tk.END)
        self.amount_entry.delete(0, tk.END)
        self.gst_entry.delete(0, tk.END)
        self.payment_var.set("")
        self.date_entry.set_date(datetime.today())

if __name__ == "__main__":
    root = tk.Tk()
    app = BuyFrame(root)
    app.pack(fill=tk.BOTH, expand=True)
    root.mainloop()
