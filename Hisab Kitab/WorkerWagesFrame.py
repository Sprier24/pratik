import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import mysql.connector
from tkcalendar import DateEntry

class Database:
    def __init__(self):
        self.conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root123',
            database='dailywages sunday',
        )
        self.cursor = self.conn.cursor()

    def fetch_all(self, name_filter=None):
        query = "SELECT name, date, hours_worked, wage_rate, total_wage, des FROM wages"
        if name_filter:
            query += " WHERE name LIKE %s"
            self.cursor.execute(query, (f"%{name_filter}%",))
        else:
            self.cursor.execute(query)
        return self.cursor.fetchall()

    def insert(self, name, date, hours_worked, wage_rate, total_wage, des):
        query = "INSERT INTO wages (name, date, hours_worked, wage_rate, total_wage, des) VALUES (%s, %s, %s, %s, %s, %s)"
        self.cursor.execute(query, (name, date, hours_worked, wage_rate, total_wage, des))
        self.conn.commit()

    def update(self, old_name, old_date, name, date, hours_worked, wage_rate, total_wage, des):
        query = """UPDATE wages 
                   SET name = %s, date = %s, hours_worked = %s, wage_rate = %s, total_wage = %s, des = %s 
                   WHERE name = %s AND date = %s"""
        self.cursor.execute(query, (name, date, hours_worked, wage_rate, total_wage, des, old_name, old_date))
        self.conn.commit()

    def delete(self, name, date):
        query = "DELETE FROM wages WHERE name = %s AND date = %s"
        self.cursor.execute(query, (name, date))
        self.conn.commit()

    def close(self):
        self.cursor.close()
        self.conn.close()

class WorkerWagesFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.master = master
        self.master.title("Hisab Kitab")
        self.master.geometry("800x600")
        self.database = Database()
        self.selected_entry = None
        self.setup_ui()
        self.load_entries()

    def setup_ui(self):
        main_frame = tk.Frame(self)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        input_frame = tk.Frame(main_frame)
        input_frame.pack()   
        tk.Label(input_frame, text="Name").grid(row=0, column=0)
        tk.Label(input_frame, text="Date (yyyy-mm-dd)").grid(row=0, column=1)
        tk.Label(input_frame, text="Hours Worked").grid(row=0, column=2)
        tk.Label(input_frame, text="Wage Rate").grid(row=0, column=3)
        tk.Label(input_frame, text="Description").grid(row=0, column=4)  
        self.name_entry = tk.Entry(input_frame, width=60) 
        self.date_entry = DateEntry(input_frame, background='darkblue', foreground='white', borderwidth=2, date_pattern='yyyy-mm-dd', width=40) 
        self.hours_work_entry = tk.Entry(input_frame, width=40) 
        self.wage_rate_entry = tk.Entry(input_frame, width=40)  
        self.description_entry = tk.Entry(input_frame, width=60)  
        self.name_entry.grid(row=1, column=0)
        self.date_entry.grid(row=1, column=1)
        self.hours_work_entry.grid(row=1, column=2)
        self.wage_rate_entry.grid(row=1, column=3)
        self.description_entry.grid(row=1, column=4)
        tk.Button(main_frame, text="Add Entry", command=self.add_entry, width=10).pack(pady=10)
        filter_frame = tk.Frame(main_frame)
        filter_frame.pack(pady=5)
        tk.Label(filter_frame, text="Filter by Name:").pack(side="left")
        self.filter_entry = tk.Entry(filter_frame, width=30) 
        self.filter_entry.pack(side="left", padx=5)
        tk.Button(filter_frame, text="Apply Filter", command=self.apply_filter, width=10).pack(side="left", padx=5)
        tk.Button(filter_frame, text="Clear Filter", command=self.clear_filter, width=10).pack(side="left", padx=5)
        table_frame = tk.Frame(main_frame)
        table_frame.pack(fill=tk.BOTH, expand=True, pady=10)    
        columns = ("Name", "Date", "Hours Worked", "Wage Rate", "Total Wage", "Description")
        self.table = ttk.Treeview(table_frame, columns=columns, show="headings", height=10)      
        for col in columns:
            self.table.heading(col, text=col)
            self.table.column(col, anchor="center", stretch=True)
        total_frame = tk.Frame(main_frame)
        total_frame.pack(pady=10)
        self.total_amount_label = tk.Label(total_frame, text="Total Amount: 0.00")
        self.total_amount_label.pack(side="left", padx=10)
        self.table.pack(fill=tk.BOTH, expand=True)
        button_frame = tk.Frame(main_frame)
        button_frame.pack(pady=10)
        tk.Button(button_frame, text="Edit", command=self.edit_entry, width=10,).pack(side="left", padx=5)
        tk.Button(button_frame, text="Delete", command=self.delete_entry, width=10,).pack(side="left", padx=5)
        tk.Button(button_frame, text="Update Entry", command=self.update_entry, width=10,).pack(side="left", padx=5)

    def calculate_wage(self, hours, wage_rate):
        try:
            return float(hours) * float(wage_rate)
        except ValueError:
            return 0

    def add_entry(self):
        name = self.name_entry.get()
        date = self.date_entry.get()
        hours_worked = self.hours_work_entry.get()
        wage_rate = self.wage_rate_entry.get()
        des = self.description_entry.get()
        total_wage = self.calculate_wage(hours_worked, wage_rate)
        if not (name and date and hours_worked and wage_rate and des):
            messagebox.showwarning("Input Error", "Please fill all fields.")
            return
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            messagebox.showwarning("Date Error", "The date format should be yyyy-mm-dd.")
            return
        self.database.insert(name, date, hours_worked, wage_rate, total_wage, des)
        self.load_entries()
        self.clear_entries()

    def load_entries(self, name_filter=None):
        for item in self.table.get_children():
            self.table.delete(item)
        wages = self.database.fetch_all(name_filter)
        total_amount = 0
        for record in wages:
            self.table.insert("", "end", values=record)
            total_amount += record[4]
        self.total_amount_label.config(text=f"Total Amount: {total_amount:.2f}")

    def apply_filter(self):
        name_filter = self.filter_entry.get()
        self.load_entries(name_filter=name_filter)

    def clear_filter(self):
        self.filter_entry.delete(0, tk.END)
        self.load_entries()

    def clear_entries(self):
        self.name_entry.delete(0, tk.END)
        self.date_entry.set_date(datetime.now())
        self.hours_work_entry.delete(0, tk.END)
        self.wage_rate_entry.delete(0, tk.END)
        self.description_entry.delete(0, tk.END)
        self.selected_entry = None

    def edit_entry(self):
        selected_item = self.table.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select an item to edit.")
            return
        values = self.table.item(selected_item)['values']
        self.clear_entries()
        self.name_entry.insert(0, values[0])
        date_str = values[1]
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            self.date_entry.set_date(date_obj)
        except ValueError:
            messagebox.showwarning("Date Error", "The date format is incorrect.")
        self.hours_work_entry.insert(0, values[2])
        self.wage_rate_entry.insert(0, values[3])
        self.description_entry.insert(0, values[5])
        self.selected_entry = values

    def update_entry(self):
        if not self.selected_entry:
            messagebox.showwarning("Selection Error", "Please select an item to edit.")
            return
        name = self.name_entry.get()
        date = self.date_entry.get()
        hours_worked = self.hours_work_entry.get()
        wage_rate = self.wage_rate_entry.get()
        des = self.description_entry.get()
        total_wage = self.calculate_wage(hours_worked, wage_rate)
        if not (name and date and hours_worked and wage_rate and des):
            messagebox.showwarning("Input Error", "Please fill all fields.")
            return
        self.database.update(
            old_name=self.selected_entry[0], 
            old_date=self.selected_entry[1],
            name=name, 
            date=date, 
            hours_worked=hours_worked, 
            wage_rate=wage_rate, 
            total_wage=total_wage, 
            des=des
        )
        self.load_entries()
        self.clear_entries()

    def delete_entry(self):
        selected_item = self.table.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select an item to delete.")
            return
        values = self.table.item(selected_item)['values']
        self.database.delete(values[0], values[1])
        self.load_entries()

    def on_closing(self):
        self.database.close()
        self.master.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = WorkerWagesFrame(root)
    app.pack(fill="both", expand=True)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()
 