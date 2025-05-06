import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import mysql.connector
from tkcalendar import DateEntry

class TransactionFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.connection = mysql.connector.connect(
           host='localhost',
            user='root',
            password='root123',
            database='dailywages sunday',
        )
        self.cursor = self.connection.cursor()
        create_table_query = """
        CREATE TABLE IF NOT EXISTS transections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            purpose VARCHAR(255),
            amount DECIMAL(10, 2) NOT NULL,
            transection_date DATE NOT NULL
        )
        """
        self.cursor.execute(create_table_query)
        self.connection.commit()
        self.setup_ui()
        self.load_records()

    def setup_ui(self):
        self.master.title("Transaction Manager")
        self.master.geometry("800x600")
        main_frame = tk.Frame(self, padx=10, pady=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        tk.Label(main_frame, text="Name", font=("helvetica", 10)).grid(row=0, column=0, padx=5, pady=5)
        self.name_entry = tk.Entry(main_frame, width=50)
        self.name_entry.grid(row=0, column=1, padx=5, pady=5)
        tk.Label(main_frame, text="Description", font=("helvetica", 10)).grid(row=1, column=0, padx=5, pady=5)
        self.description_entry = tk.Entry(main_frame, width=50)
        self.description_entry.grid(row=1, column=1, padx=5, pady=5)
        tk.Label(main_frame, text="Purpose", font=("helvetica", 10)).grid(row=2, column=0, padx=5, pady=5)
        self.purpose_entry = tk.Entry(main_frame, width=50)
        self.purpose_entry.grid(row=2, column=1, padx=5, pady=5)
        tk.Label(main_frame, text="Amount", font=("helvetica", 10)).grid(row=3, column=0, padx=5, pady=5)
        self.amount_entry = tk.Entry(main_frame, width=50)
        self.amount_entry.grid(row=3, column=1, padx=5, pady=5)
        tk.Label(main_frame, text="Date", font=("helvetica", 10)).grid(row=4, column=0, padx=5, pady=5)
        self.date_entry = DateEntry(main_frame, width=48, background='darkblue', foreground='white', borderwidth=2, date_pattern='dd/mm/yyyy')
        self.date_entry.grid(row=4, column=1, padx=5, pady=5)
        submit_button = tk.Button(main_frame, font=("helvetica", 10), width=15, text="Submit", command=self.submit)
        submit_button.grid(row=5, column=1, columnspan=3, pady=10)
        filter_frame = tk.Frame(self, padx=10, pady=10)
        filter_frame.pack(fill=tk.X)
        tk.Label(filter_frame, text="Filter by Month", font=("helvetica", 10)).pack(side=tk.LEFT, padx=5)
        self.month_var = tk.StringVar()
        month_dropdown = ttk.Combobox(filter_frame, width=20, textvariable=self.month_var, values=[
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ])
        month_dropdown.pack(side=tk.LEFT, padx=5)
        tk.Label(filter_frame, text="Year", font=("helvetica", 10)).pack(side=tk.LEFT, padx=5)
        self.year_entry = tk.Entry(filter_frame, width=20)
        self.year_entry.pack(side=tk.LEFT, padx=5)
        show_button = tk.Button(filter_frame, font=("helvetica", 10), width=15, text="Show", command=self.filter_by_date)
        show_button.pack(side=tk.LEFT, padx=5)
        clear_filter_button = tk.Button(filter_frame, font=("helvetica", 10), width=15, text="Clear Filter", command=self.clear_filter)
        clear_filter_button.pack(side=tk.LEFT, padx=5)
        table_frame = tk.Frame(self)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.table = ttk.Treeview(table_frame, columns=("Name", "Description", "Purpose", "Amount", "Date"), show='headings')
        self.table.heading("Name", text="Name")
        self.table.heading("Description", text="Description")
        self.table.heading("Purpose", text="Purpose")
        self.table.heading("Amount", text="Amount")
        self.table.heading("Date", text="Date (DD/MM/YYYY)")
        self.table.pack(fill=tk.BOTH, expand=True)
        self.table.bind("<Double-1>", self.on_item_double_click)
        edit_button = tk.Button(table_frame, font=("helvetica", 10), text="Edit", width=10, command=self.edit)
        edit_button.pack(side=tk.LEFT, padx=10, pady=20)
        delete_button = tk.Button(table_frame, font=("helvetica", 10), text="Delete", width=10, command=self.delete)
        delete_button.pack(side=tk.LEFT, padx=10, pady=20)
        self.filtered_total_label = tk.Label(table_frame, font=("helvetica", 10), text="Filtered Total Amount: 0.00")
        self.filtered_total_label.pack(side=tk.LEFT, padx=5)

    def submit(self):
        name = self.name_entry.get()
        description = self.description_entry.get()
        purpose = self.purpose_entry.get()
        amount = self.amount_entry.get()
        date = self.date_entry.get()
        if not all([name, description, purpose, amount, date]):
            messagebox.showwarning("Input Error", "Please fill all fields")
            return
        try:
            amount = float(amount.replace('', '').replace(',', ''))
        except ValueError:
            messagebox.showwarning("Input Error", "Amount must be a valid number")
            return
        try:
            date = datetime.strptime(date, "%d/%m/%Y").date()
        except ValueError:
            messagebox.showwarning("Input Error", "Date must be in DD/MM/YYYY format")
            return
        query = "INSERT INTO transections (name, description, purpose, amount, transection_date) VALUES (%s, %s, %s, %s, %s)"
        values = (name, description, purpose, amount, date)
        self.cursor.execute(query, values)
        self.connection.commit()
        self.load_records()
        self.clear_entries()

    def load_records(self):
        query = "SELECT id, name, description, purpose, amount, transection_date FROM transections"
        self.cursor.execute(query)
        rows = self.cursor.fetchall()
        records = [(row[1], row[2], row[3], row[4], row[5]) for row in rows]  # Exclude ID
        self.update_table(records)

    def update_table(self, records):
        self.table.delete(*self.table.get_children())
        for record in records:
            self.table.insert("", tk.END, values=(
                record[0], 
                record[1], 
                record[2], 
                f"{record[3]:,.2f}",  
                record[4].strftime("%d/%m/%Y") 
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
        except ValueError:
            messagebox.showwarning("Input Error", "Year must be a valid number")
            return
        month_number = datetime.strptime(month, "%B").month
        query = """
        SELECT id, name, description, purpose, amount, transection_date 
        FROM transections 
        WHERE MONTH(transection_date)=%s AND YEAR(transection_date)=%s
        """
        self.cursor.execute(query, (month_number, year))
        rows = self.cursor.fetchall()
        records = [(row[1], row[2], row[3], row[4], row[5]) for row in rows] 
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
            self.purpose_entry.delete(0, tk.END)
            self.purpose_entry.insert(tk.END, record[2])
            self.amount_entry.delete(0, tk.END)
            self.amount_entry.insert(tk.END, record[3].replace(',', ''))
            self.date_entry.set_date(record[4])
            self.selected_record_id = self.get_record_id(record)

    def edit(self):
        if not hasattr(self, 'selected_record_id'):
            messagebox.showwarning("Selection Error", "Please select a record to edit")
            return
        name = self.name_entry.get()
        description = self.description_entry.get()
        purpose = self.purpose_entry.get()
        amount = self.amount_entry.get()
        date = self.date_entry.get()
        if not all([name, description, purpose, amount, date]):
            messagebox.showwarning("Input Error", "Please fill all fields")
            return
        try:
            amount = float(amount.replace('', '').replace(',', ''))
        except ValueError:
            messagebox.showwarning("Input Error", "Amount must be a valid number")
            return
        try:
            date = datetime.strptime(date, "%d/%m/%Y").date()
        except ValueError:
            messagebox.showwarning("Input Error", "Date must be in DD/MM/YYYY format")
            return
        query = "UPDATE transections SET name=%s, description=%s, purpose=%s, amount=%s, transection_date=%s WHERE id=%s"
        values = (name, description, purpose, amount, date, self.selected_record_id)
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
                query = "DELETE FROM transections WHERE id=%s"
                self.cursor.execute(query, (record_id,))
                self.connection.commit()
                self.load_records()
                messagebox.showinfo("Success", "Record deleted successfully")

    def get_record_id(self, record):
        query = "SELECT id FROM transections WHERE name=%s AND description=%s AND purpose=%s AND amount=%s AND transection_date=%s"
        values = (record[0], record[1], record[2], float(record[3].replace(',', '')), datetime.strptime(record[4], "%d/%m/%Y").date())
        self.cursor.execute(query, values)
        row = self.cursor.fetchone()
        return row[0] if row else None

    def clear_entries(self):
        self.name_entry.delete(0, tk.END)
        self.description_entry.delete(0, tk.END)
        self.purpose_entry.delete(0, tk.END)
        self.amount_entry.delete(0, tk.END)
        self.date_entry.set_date(datetime.now().date())

if __name__ == "__main__":
    root = tk.Tk()
    app = TransactionFrame(master=root)
    app.pack(fill=tk.BOTH, expand=True)
    root.mainloop()
