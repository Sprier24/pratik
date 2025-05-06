import tkinter as tk
from tkinter import ttk, messagebox
import mysql.connector
from tkcalendar import DateEntry
import datetime

class PaymentsFrame(tk.Frame):
    def __init__(self, root):
        super().__init__(root)
        self.root = root
        self.root.title("Pending Payments Page")
        self.root.geometry("900x800")
        self.db = mysql.connector.connect(
             host='localhost',
            user='root',
            password='root123',
            database='dailywages sunday',
        )
        self.cursor = self.db.cursor()
        self.create_header()
        self.main_frame = tk.Frame(self, padx=10, pady=10)
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        self.setup_form()
        self.setup_filter()
        self.setup_search()
        self.setup_table()
        self.create_footer()
        self.load_records()
        self.editing_record_id = None

    def create_header(self):
        header_frame = tk.Frame(self.root, bg="lightblue", padx=10, pady=10)
        header_frame.pack(fill=tk.X)

    def setup_form(self):
       tk.Label(self.main_frame, text="Name").grid(row=0, column=0, padx=5, pady=5)
       self.name_entry = tk.Entry(self.main_frame, width=40)
       self.name_entry.grid(row=0, column=1, padx=5, pady=5)
       tk.Label(self.main_frame, text="Description").grid(row=1, column=0, padx=5, pady=5)
       self.description_entry = tk.Entry(self.main_frame, width=40)
       self.description_entry.grid(row=1, column=1, padx=5, pady=5)
       tk.Label(self.main_frame, text="Amount Due").grid(row=2, column=0, padx=5, pady=5)
       self.amount_due_entry = tk.Entry(self.main_frame, width=40)
       self.amount_due_entry.grid(row=2, column=1, padx=5, pady=5) 
       tk.Label(self.main_frame, text="Due Date").grid(row=3, column=0, padx=5, pady=5)
       self.due_date_entry = DateEntry(self.main_frame, date_pattern='dd-mm-yyyy', width=27)
       self.due_date_entry.grid(row=3, column=1, padx=5, pady=5)
       tk.Label(self.main_frame, text="Paid/Unpaid").grid(row=4, column=0, padx=5, pady=5)
       self.paid_unpaid_var = tk.StringVar(value="Unpaid")
       tk.Radiobutton(self.main_frame, text="Paid", variable=self.paid_unpaid_var, value="Paid").grid(row=4, column=1, padx=5, pady=5, sticky=tk.W)
       tk.Radiobutton(self.main_frame, text="Unpaid", variable=self.paid_unpaid_var, value="Unpaid").grid(row=4, column=1, padx=5, pady=5, sticky=tk.E)
       self.submit_button = tk.Button(self.main_frame, text="Submit", command=self.submit, width=15)
       self.submit_button.grid(row=5, column=0, columnspan=2, pady=10)

    def setup_filter(self):
        self.filter_frame = tk.Frame(self.main_frame, padx=10, pady=10)
        self.filter_frame.grid(row=6, column=0, columnspan=2, pady=10)
        tk.Label(self.filter_frame, text="Filter by Payment Status:").pack(side=tk.LEFT, padx=5)
        self.filter_var = tk.StringVar(value="All")
        self.filter_menu = tk.OptionMenu(self.filter_frame, self.filter_var, "All", "Paid", "Unpaid", command=self.apply_filter)
        self.filter_menu.pack(side=tk.LEFT, padx=5)
        self.clear_filter_button = tk.Button(self.filter_frame, text="Clear Filter", command=self.clear_filter, width=15)
        self.clear_filter_button.pack(side=tk.LEFT, padx=5)
    
    def setup_search(self):
        self.search_frame = tk.Frame(self.main_frame, padx=10, pady=10)
        self.search_frame.grid(row=7, column=0, columnspan=2, pady=10)
        tk.Label(self.search_frame, text="Search by Name/Date:").pack(side=tk.LEFT, padx=5)
        self.search_entry = tk.Entry(self.search_frame)
        self.search_entry.pack(side=tk.LEFT, padx=5)
        self.search_button = tk.Button(self.search_frame, text="Search", command=self.search, width=15)
        self.search_button.pack(side=tk.LEFT, padx=5)
    
    def setup_table(self):
        self.table_frame = tk.Frame(self)
        self.table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.table = ttk.Treeview(self.table_frame, columns=("Name", "Description", "Amount Due", "Due Date", "Paid/Unpaid"), show='headings')
        self.table.heading("Name", text="Name")
        self.table.heading("Description", text="Description")
        self.table.heading("Amount Due", text="Amount Due")
        self.table.heading("Due Date", text="Due Date")
        self.table.heading("Paid/Unpaid", text="Paid/Unpaid")
        self.table.pack(fill=tk.BOTH, expand=True)
        self.edit_button = tk.Button(self.table_frame, text="Edit", command=self.edit, width=15)
        self.edit_button.pack(side=tk.LEFT, padx=5, pady=(5, 0))
        self.delete_button = tk.Button(self.table_frame, text="Delete", command=self.delete, width=15)
        self.delete_button.pack(side=tk.LEFT, padx=5, pady=(5, 0))

    def create_footer(self):
        self.footer_frame = tk.Frame(self.root, bg="lightgray")
        self.footer_frame.pack(side=tk.BOTTOM, fill=tk.X)
        self.left_footer = tk.Label(self.footer_frame, text="2024 © All Rights Reserved By Hisab Kitab.", bg="lightgray")
        self.left_footer.pack(side=tk.LEFT, padx=5, pady=5)
        self.right_footer = tk.Label(self.footer_frame, text="Design By SPRIERS PVT. LTD.", bg="lightgray")
        self.right_footer.pack(side=tk.RIGHT, padx=5, pady=5)

    def load_records(self):
        self.table.delete(*self.table.get_children())
        select_query = "SELECT id, name, description, amount_due, due_date, paid_unpaid FROM payments"
        self.cursor.execute(select_query)
        records = self.cursor.fetchall()
        for record in records:
            self.table.insert("", tk.END, values=record[1:], iid=record[0])

    def submit(self):
        name = self.name_entry.get()
        description = self.description_entry.get()
        amount_due = self.amount_due_entry.get()
        due_date_str = self.due_date_entry.get()
        paid_unpaid = self.paid_unpaid_var.get()
        if not all([name, description, amount_due, due_date_str]):
            messagebox.showwarning("Input Error", "Please fill all fields")
            return
        try:
            due_date = datetime.datetime.strptime(due_date_str, '%d-%m-%Y').strftime('%Y-%m-%d')
        except ValueError:
            messagebox.showwarning("Date Error", "Please enter a valid date in DD-MM-YYYY format")
            return
        if self.editing_record_id: 
            if messagebox.askyesno("Confirm Update", "Are you sure you want to update this record?"):
                update_query = """
                    UPDATE payments 
                    SET name = %s, description = %s, amount_due = %s, due_date = %s, paid_unpaid = %s
                    WHERE id = %s
                """
                self.cursor.execute(update_query, (name, description, amount_due, due_date, paid_unpaid, self.editing_record_id))
                self.db.commit()
                messagebox.showinfo("Success", "Record updated successfully")
                self.editing_record_id = None
        else:
            if messagebox.askyesno("Confirm Insert", "Are you sure you want to add this record?"):
                insert_query = """
                    INSERT INTO payments (name, description, amount_due, due_date, paid_unpaid)
                    VALUES (%s, %s, %s, %s, %s)
                """
                self.cursor.execute(insert_query, (name, description, amount_due, due_date, paid_unpaid))
                self.db.commit()
                messagebox.showinfo("Success", "Record added successfully")
        self.load_records()
        self.clear_entries()

    def clear_entries(self):
        self.name_entry.delete(0, tk.END)
        self.description_entry.delete(0, tk.END)
        self.amount_due_entry.delete(0, tk.END)
        self.due_date_entry.set_date(datetime.datetime.now())
        self.paid_unpaid_var.set("Unpaid")

    def apply_filter(self, value):
        self.table.delete(*self.table.get_children())
        if value == "All":
            select_query = "SELECT id, name, description, amount_due, due_date, paid_unpaid FROM payments"
            self.cursor.execute(select_query)
        else:
            select_query = "SELECT id, name, description, amount_due, due_date, paid_unpaid FROM payments WHERE paid_unpaid = %s"
            self.cursor.execute(select_query, (value,))
        records = self.cursor.fetchall()
        for record in records:
            self.table.insert("", tk.END, values=record[1:], iid=record[0])
  
    def clear_filter(self):
       self.filter_var.set("All")
       self.load_records()

    def search(self):
        search_term = self.search_entry.get().strip()
        self.table.delete(*self.table.get_children())
        if not search_term:
            self.load_records()
            return
        search_query = "SELECT id, name, description, amount_due, due_date, paid_unpaid FROM payments WHERE name LIKE %s OR due_date LIKE %s"
        self.cursor.execute(search_query, (f"%{search_term}%", f"%{search_term}%"))
        search_results = self.cursor.fetchall()
        for record in search_results:
            self.table.insert("", tk.END, values=record[1:], iid=record[0])

    def edit(self):
        selected_item = self.table.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select an item to edit")
            return
        selected_item = selected_item[0]
        values = self.table.item(selected_item, 'values')
        self.name_entry.delete(0, tk.END)
        self.name_entry.insert(0, values[0]) 
        self.description_entry.delete(0, tk.END)
        self.description_entry.insert(0, values[1])  
        self.amount_due_entry.delete(0, tk.END)
        self.amount_due_entry.insert(0, values[2])  
        self.due_date_entry.set_date(datetime.datetime.strptime(values[3], '%Y-%m-%d')) 
        self.paid_unpaid_var.set(values[4])
        self.editing_record_id = selected_item

    def delete(self):
        selected_item = self.table.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select an item to delete")
            return
        selected_item = selected_item[0]
        if messagebox.askyesno("Confirm Delete", "Are you sure you want to delete this record?"):
            delete_query = "DELETE FROM payments WHERE id = %s"
            self.cursor.execute(delete_query, (selected_item,))
            self.db.commit()
            self.load_records()
            messagebox.showinfo("Success", "Record deleted successfully")

if __name__ == "__main__":
    root = tk.Tk()
    app = PaymentsFrame(root)
    app.pack(fill="both", expand=True)
    root.mainloop()
