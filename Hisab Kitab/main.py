import tkinter as tk
from tkinter import messagebox
import mysql.connector

from BillManagerFrame import BillManagerFrame
from HomeFrame import HomeFrame
from InvoiceFrame import InvoiceFrame
from PaymentsFrame import PaymentsFrame
from TransactionFrame import TransactionFrame
from WorkerWagesFrame import WorkerWagesFrame
from BuyFrame import BuyFrame

class Application(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Single Window Output Example")
        self.geometry("1920x1080")
        self.navbar_frame = tk.Frame(self, bg="aquamarine", padx=10, pady=10)
        self.frames = {
            "home": HomeFrame(self),
            "invoice": InvoiceFrame(self),
            "pending_payment": PaymentsFrame(self),
            "transactions": TransactionFrame(self),
            "worker_wages": WorkerWagesFrame(self),
            "bill": BillManagerFrame(self),
            "buy": BuyFrame(self),
        }
        self.login_frame = LoginFrame(self, self.on_login_success)
        self.show_frame("login_frame")
        self.is_logged_in = False

    def create_navbar(self):
        self.navbar_frame.pack(fill=tk.X)

        buttons = {
            "Home": "home",
            "Invoice": "invoice",
            "Pending Payment": "pending_payment",
            "Transactions": "transactions",
            "Worker Wages": "worker_wages",
            "Bill Management": "bill",
            "Purchase": "buy",
        }

        for text, frame in buttons.items():
            btn = tk.Button(self.navbar_frame, 
                            text=text, 
                            command=lambda f=frame: self.show_frame(f), 
                            width=15,
                            height=1,
                            bg="white", 
                            fg="black", 
                            font=("Arial", 12)) 
            btn.pack(side=tk.LEFT, padx=5, pady=5)

    def show_frame(self, frame_name):
        if frame_name in self.frames and self.is_logged_in:
            frame = self.frames[frame_name]
            for f in self.frames.values():
                f.pack_forget() 
            self.navbar_frame.pack(fill=tk.X)  
            frame.pack(fill='both', expand=True)  
        elif frame_name == "login_frame":
            self.navbar_frame.pack_forget()  
            self.login_frame.pack(fill='both', expand=True) 

    def on_login_success(self):
        self.login_frame.pack_forget()  
        self.is_logged_in = True  
        self.create_navbar()  
        self.show_frame("home")

    def logout(self):
        self.is_logged_in = False 
        self.show_frame("login_frame") 


class LoginFrame(tk.Frame):
    def __init__(self, parent, show_frame):
        super().__init__(parent)
        self.parent = parent
        self.show_frame = show_frame
        self.configure(bg="#f0f0f0")
        self.login_box = tk.Frame(self, bg="white", bd=2, relief="solid", padx=150, pady=100)
        self.login_box.pack(pady=100)
        self.label = tk.Label(self.login_box, text="Hisab Kitab", font=('Arial', 40, 'bold'), bg="white")
        self.label.pack(pady=10)
        self.username_label = tk.Label(self.login_box, text="Username:", font=('Arial', 15), bg="white")
        self.username_label.pack(anchor='w', pady=5)
        self.username_entry = tk.Entry(self.login_box, width=30, font=('Arial', 15), bd=2, relief="groove")
        self.username_entry.pack(pady=5)
        self.password_label = tk.Label(self.login_box, text="Password:", font=('Arial', 15), bg="white")
        self.password_label.pack(anchor='w', pady=5)
        self.password_entry = tk.Entry(self.login_box, show="*", width=30, font=('Arial', 15), bd=2, relief="groove")
        self.password_entry.pack(pady=5)
        self.show_password_var = tk.BooleanVar()
        self.show_password_checkbox = tk.Checkbutton(self.login_box, text="Show Password", variable=self.show_password_var, command=self.toggle_password)
        self.show_password_checkbox.pack(pady=5)
        self.login_button = tk.Button(self.login_box, text="Login", command=self.login, font=('Arial', 18), bg="#4CAF50", fg="white", relief="flat")
        self.login_button.pack(pady=5)

    def create_footer(self):
        left_text = tk.Label(self.footer_frame, text="2024 © All Rights Reserved By Hisab Kitab.", bg='lightgray', font=('Arial', 12))
        left_text.pack(side=tk.LEFT, padx=10, pady=5)
        right_text = tk.Label(self.footer_frame, text="Design By SPRIERS PVT. LTD.", bg='lightgray', font=('Arial', 12))
        right_text.pack(side=tk.RIGHT, padx=10, pady=5) 

    def toggle_password(self):
        if self.show_password_var.get():
            self.password_entry.config(show="")
        else:
            self.password_entry.config(show="*")

    def on_forgot_password(self, event):
        messagebox.showinfo("Info", "Password recovery is not implemented yet.")

    def login(self):
        username = self.username_entry.get()
        password = self.password_entry.get()

        try:
            conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root123',
            database='dailywages sunday',
            )
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
            user = cursor.fetchone()
            conn.close()

            if user:
                self.show_frame()
            else:
                messagebox.showerror("Login Error", "Invalid username or password.")
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Error: {err}")

if __name__ == "__main__":
    app = Application()
    app.mainloop()
