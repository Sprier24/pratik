import tkinter as tk
import mysql.connector
from datetime import datetime

class HomeFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master)

        # Create the header
        header_frame = tk.Frame(self, bg="lightblue", padx=10, pady=10)
        header_frame.pack(fill=tk.X)

        # Create the section area
        section_frame = tk.Frame(self, padx=10, pady=10)
        section_frame.pack(pady=(0, 10), fill=tk.BOTH, expand=True)

        # Create four large boxes in one line and center them
        self.total_expense_var = tk.StringVar()
        self.pending_payment_var = tk.StringVar()
        self.worker_wages_var = tk.StringVar()
        self.worker_count_var = tk.StringVar()

        box_labels = ["Total Expense", "Pending Payment", "Worker Wages", "Worker Count"]
        vars = [self.total_expense_var, self.pending_payment_var, self.worker_wages_var, self.worker_count_var]

        for idx, (label_text, var) in enumerate(zip(box_labels, vars)):
            frame = tk.Frame(section_frame, padx=120, pady=120, relief=tk.RAISED, borderwidth=2, width=200, height=200)
            frame.grid(row=0, column=idx, padx=10, pady=150, sticky="nsew")

            label = tk.Label(frame, text=label_text)
            label.pack(pady=(10, 0))

            value = tk.Label(frame, textvariable=var, font=("Arial", 20))
            value.pack(pady=(5, 10))

        # Adjust column weights to ensure centering
        for col in range(4):
            section_frame.grid_columnconfigure(col, weight=1)

        # Update the data for the current month
        self.current_month = datetime.now().strftime('%Y-%m')
        self.update_data()

        # Create cards for displaying data
        # self.create_cards()

    def create_cards(self):
        card_frame = tk.Frame(self)
        card_frame.pack(pady=120, fill=tk.BOTH, expand=True )

        titles = ["Total Expense", "Pending Payment", "Worker Wages", "Worker Count"]
        vars = [self.total_expense_var, self.pending_payment_var, self.worker_wages_var, self.worker_count_var]

        # Using grid layout for more control over the placement
        for idx, (title, value_var) in enumerate(zip(titles, vars)):
            card = tk.Frame(card_frame, bg="white", relief=tk.RAISED, bd=30, padx=20, pady=20)
            card.grid(row=0, column=idx, padx=10, pady=10, sticky="nsew")  # Use grid instead of pack

            title_label = tk.Label(card, text=title, font=("Helvetica", 25), bg="white")
            title_label.pack(pady=(10, 0))

            value_label = tk.Label(card, textvariable=value_var, font=("Helvetica", 30, "bold"), bg="#219B9D")
            value_label.pack(pady=(5, 10))

        # Ensure all columns have equal weight to expand and fill the available space
        for col in range(4):
            card_frame.grid_columnconfigure(col, weight=1)

    def update_data(self):
        total_expense = self.get_total_expense(self.current_month)
        print("Total Expense:", total_expense)  # Debugging output
        unpaid_amount = self.get_unpaid_amount(self.current_month)
        worker_count = self.get_worker_count(self.current_month)
        total_wages = self.get_total_wages(self.current_month)
    
        self.total_expense_var.set(f"{total_expense:,.2f}")
        self.pending_payment_var.set(f"{unpaid_amount:,.2f}")
        self.worker_wages_var.set(f"{total_wages:,.2f}")
        self.worker_count_var.set(f"{worker_count}")


    def get_worker_count(self, month):
        config = {
            'user': 'root',
            'password': 'root123',
            'host': 'localhost',
            'database': 'dailywages sunday'
        }

        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(DISTINCT name) FROM wages WHERE DATE_FORMAT(date, '%Y-%m') = %s", (month,))
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def get_total_wages(self, month):
        config = {
            'user': 'root',
            'password': 'root123',
            'host': 'localhost',
            'database': 'dailywages sunday'
        }

        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(total_wage) FROM wages WHERE DATE_FORMAT(date, '%Y-%m') = %s", (month,))
        total = cursor.fetchone()[0]
        conn.close()

        return total if total is not None else 0

    def get_unpaid_amount(self, month):
        config = {
            'user': 'root',
            'password': 'root123',
            'host': 'localhost',
            'database': 'dailywages sunday'
        }

        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(amount_due) FROM payments WHERE paid_unpaid = 'unpaid' AND DATE_FORMAT(due_date, '%Y-%m') = %s", (month,))
        total = cursor.fetchone()[0]
        conn.close()

        return total if total is not None else 0

    def get_total_expense(self, month):
        config = {
            'user': 'root',
            'password': 'root123',
            'host': 'localhost',
            'database': 'dailywages sunday'
        }

        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(amount) FROM transections WHERE DATE_FORMAT(transection_date, '%Y-%m') = %s", (month,))
        total = cursor.fetchone()[0]
        conn.close()

        return total if total is not None else 0

    # Placeholder functions for button commands
    def open_invoice_page(self, master):
        pass

    def open_pending_page(self, master):
        pass

    def open_transaction_page(self, master):
        pass

    def open_workerwages_page(self, master):
        pass

    def open_bill_page(self, master):
        pass

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Home Page")
    HomeFrame(root).pack(fill=tk.BOTH, expand=True)
    root.mainloop()
