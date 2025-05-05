import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
from tkcalendar import DateEntry  # Import DateEntry from tkcalendar
from reportlab.lib import colors
from reportlab.lib.pagesizes import inch
import mysql.connector
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

class InvoiceFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.master = master
        self.db_connection = None
        self.db_cursor = None
        self.selected_id = None  # Variable to store selected ID
        self.total = 0.00
        self.grand_total = 0.00
        self.init_db()
        self.init_ui()

    def init_db(self):
        try:
            self.db_connection = mysql.connector.connect(
              host='localhost',
            user='root',
            password='root123',
            database='dailywages sunday',
            )
            self.db_cursor = self.db_connection.cursor()
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Error connecting to database: {err}")

    def init_ui(self):
        self.master.title("Invoice Page")
        self.master.geometry("1000x500")  # Adjust the overall window size
    
        # Remove the header
        # self.create_header()  # This line can be removed.
    
        # Form section
        self.form_frame = tk.Frame(self)
        self.form_frame.pack(pady=5)  # Reduced vertical padding
    
        self.create_form()  # Create the form
    
        # Search section (if needed)
        self.search_frame = tk.Frame(self)
        self.search_frame.pack(pady=5)
    
        self.create_search_box()  # Create the search box (if needed)
    
        # Table section
        self.table_frame = tk.Frame(self)
        self.table_frame.pack(pady=10, fill=tk.BOTH, expand=True)
    
        self.create_table()  # Create the table to display the data
    
        self.load_data()  # Load the data


    def create_form(self):
        labels = ['Name:', 'Description:', 'Date:', 'Price:', 'Quantity:', 'GST Rate:', 'GST No:', 'Payment Method:']
        self.entries = {}
        
        form_container = tk.Frame(self.form_frame, bg='white', padx=10, pady=10, borderwidth=2, relief='solid')
        form_container.pack(padx=10, pady=10, fill=tk.X)
        
        for i, label in enumerate(labels):
            tk.Label(form_container, text=label, anchor='e', bg='white', font=('Arial', 10)).grid(row=i, column=0, padx=10, pady=5, sticky='e')
        
            entry_frame = tk.Frame(form_container, bg='white', bd=1, relief='solid')
            entry_frame.grid(row=i, column=1, padx=5, pady=5, sticky='w')
        
            if label == 'Date:':
                date_entry = DateEntry(entry_frame, width=18, background='darkblue', foreground='white', borderwidth=2, date_pattern='yyyy-mm-dd')
                date_entry.pack(fill=tk.X, padx=2, pady=2)
                self.entries['date'] = date_entry
        
            elif label == 'GST No:':
                entry = tk.Entry(entry_frame, bg='white', font=('Arial', 10), width=25)
                entry.pack(fill=tk.X, padx=2, pady=2)
                self.entries['gst_no'] = entry
        
            elif label == 'Payment Method:':
                pay_methods = ['Cash', 'Debit/Credit', 'UPI']
                combobox = ttk.Combobox(entry_frame, values=pay_methods, font=('Arial', 12), width=20)  # Increased font size here
                combobox.set(pay_methods[0])
                combobox.pack(fill=tk.X, padx=2, pady=2)
                self.entries['pay_method'] = combobox
        
            elif label != 'GST Rate:':
                entry = tk.Entry(entry_frame, bg='white', font=('Arial', 12), width=25)  # Increased font size here
                entry.pack(fill=tk.X, padx=2, pady=2)
                self.entries[label.split(':')[0].lower()] = entry
            else:
                gst_options = ['0%', '18%', '21%']
                combobox = ttk.Combobox(entry_frame, values=gst_options, font=('Arial', 12), width=20)  # Increased font size here
                combobox.set('0%')
                combobox.pack(fill=tk.X, padx=2, pady=2)
                self.entries['gst'] = combobox
        
        self.button_frame = tk.Frame(self.form_frame)
        self.button_frame.pack(pady=10, anchor='e')
        
        submit_button = tk.Button(self.button_frame, text='Submit', command=self.add_to_table,width=10, font=('Arial', 12) ,padx=1.5, pady=1.5)  # Increased font size and padding
        submit_button.grid(row=0, column=0, padx=5)
        
        self.edit_button = tk.Button(self.button_frame, text='Edit', command=self.edit_row, width=10, state=tk.DISABLED, font=('Arial', 12), padx=1.5, pady=1.5)  # Increased font size and padding
        self.edit_button.grid(row=0, column=1, padx=5)
        
        self.delete_button = tk.Button(self.button_frame, text='Delete', command=self.delete_row, width=10, state=tk.DISABLED, font=('Arial', 12), padx=1.5, pady=1.5)  # Increased font size and padding
        self.delete_button.grid(row=0, column=2, padx=5)
        
        clear_button = tk.Button(self.button_frame, text='Clear', command=self.clear_form, width=10, font=('Arial', 12),padx=1.5, pady=1.5)  # Increased font size and padding
        clear_button.grid(row=0, column=3, padx=5)

    def clear_form(self):
        for entry in self.entries.values():
            entry.delete(0, tk.END)
        self.entries['gst'].set('0%')
        self.entries['pay_method'].set('Cash')
        self.selected_id = None  # Clear selected ID

    def create_search_box(self):
    # Create the search box and layout in the search frame
     search_name_label = tk.Label(self.search_frame, text="Search by Name:", font=('Arial', 12))
     search_name_label.grid(row=0, column=0, padx=10, pady=10)

     self.search_name_entry = tk.Entry(self.search_frame, font=('Arial', 12), width=30)
     self.search_name_entry.grid(row=0, column=1, padx=10, pady=10)

     search_date_label = tk.Label(self.search_frame, text="Search by Date:", font=('Arial', 12))
     search_date_label.grid(row=0, column=2, padx=10, pady=10)

     self.search_date_entry = tk.Entry(self.search_frame, font=('Arial', 12), width=15)
     self.search_date_entry.grid(row=0, column=3, padx=10, pady=10)
 
    # Add the 'Generate PDF' button
     search_button = tk.Button(self.search_frame, text="Generate PDF", command=self.generate_pdf, font=('Arial', 12))
     search_button.grid(row=0, column=4, padx=10, pady=10)

    def create_table(self):
      
        self.total_label = tk.Label(self.table_frame, text='Total: 0.00', font=('Arial', 10))
        self.total_label.pack()
        self.grand_total_label = tk.Label(self.table_frame, text='Grand Total: 0.00', font=('Arial', 10))
        self.grand_total_label.pack()

        columns = ['ID', 'Name', 'Description', 'Date', 'Price', 'Quantity', 'GST Rate', 'GST No', 'Payment Method', 'CGST', 'SGST', 'Total', 'Grand Total']

        table_container = tk.Frame(self.table_frame)
        table_container.pack(fill=tk.BOTH, expand=True)

        self.table = ttk.Treeview(table_container, columns=columns, show='headings')

        column_widths = [50, 150, 200, 100, 100, 100, 100, 100, 120, 100, 100, 150, 150]
        for col, width in zip(columns, column_widths):
            self.table.heading(col, text=col)
            self.table.column(col, width=width)

        self.table.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)


        self.table.bind('<<TreeviewSelect>>', self.on_select_row)

       

    def create_footer(self):
        left_text = tk.Label(self.footer_frame, text="2024 © All Rights Reserved By Hisab Kitab.", bg='lightgray', font=('Arial', 12))
        left_text.pack(side=tk.LEFT, padx=10, pady=5)

        right_text = tk.Label(self.footer_frame, text="Design By SPRIERS PVT. LTD.", bg='lightgray', font=('Arial', 12))
        right_text.pack(side=tk.RIGHT, padx=10, pady=5)

    def load_data(self):
        self.total = 0.00
        self.grand_total = 0.00
        for row in self.table.get_children():
            self.table.delete(row)
        query = "SELECT id, name, description, date, price, quantity, gst_rate, gst_no, pay_method, cgst, sgst, total_without_gst, grand_total_with_gst FROM invoice"
        self.db_cursor.execute(query)
        for record in self.db_cursor.fetchall():
            self.table.insert('', 'end', values=record)

        self.update_totals()

    def on_select_row(self, event):
        try:
            selected_item = self.table.selection()[0]
            values = self.table.item(selected_item, 'values')
            self.selected_id = values[0]  # Store the selected ID

            for key, value in zip(self.entries.keys(), values[1:]):
                self.entries[key].delete(0, tk.END)
                self.entries[key].insert(0, value)

            self.edit_button.config(state=tk.NORMAL)
            self.delete_button.config(state=tk.NORMAL)
        except IndexError:
            pass

    def add_to_table(self):
        try:
            name = self.entries['name'].get()
            description = self.entries['description'].get()
            date = self.entries['date'].get()
            price = float(self.entries['price'].get())
            quantity = float(self.entries['quantity'].get())
            gst_rate = float(self.entries['gst'].get().replace('%', ''))
            gst_no = self.entries['gst_no'].get()
            pay_method = self.entries['pay_method'].get()

            cgst = (price * quantity * gst_rate / 100) / 2
            sgst = cgst
            total_without_gst = price * quantity
            grand_total_with_gst = total_without_gst + cgst + sgst

            # Insert into database
            query = "INSERT INTO invoice (name, description, date, price, quantity, gst_rate, gst_no, pay_method, cgst, sgst, total_without_gst, grand_total_with_gst) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            values = (name, description, date, price, quantity, gst_rate, gst_no, pay_method, cgst, sgst, total_without_gst, grand_total_with_gst)
            self.db_cursor.execute(query, values)
            self.db_connection.commit()

            # Update total and grand total labels
            self.update_totals()

            self.load_data()
            self.clear_form()

        except Exception as e:
            messagebox.showerror("Error", f"Error adding invoice: {e}")

    def edit_row(self):
        if self.selected_id is None:
            messagebox.showwarning("Edit Error", "No row selected to edit.")
            return

        try:
            name = self.entries['name'].get()
            description = self.entries['description'].get()
            date = self.entries['date'].get()
            price = float(self.entries['price'].get())
            quantity = float(self.entries['quantity'].get())
            gst_rate = float(self.entries['gst'].get().replace('%', ''))
            gst_no = self.entries['gst_no'].get()
            pay_method = self.entries['pay_method'].get()

            cgst = (price * quantity * gst_rate / 100) / 2
            sgst = cgst
            total_without_gst = price * quantity
            grand_total_with_gst = total_without_gst + cgst + sgst

            query = "UPDATE invoice SET name=%s, description=%s, date=%s, price=%s, quantity=%s, gst_rate=%s, gst_no=%s, pay_method=%s, cgst=%s, sgst=%s, total_without_gst=%s, grand_total_with_gst=%s WHERE id=%s"
            values = (name, description, date, price, quantity, gst_rate, gst_no, pay_method, cgst, sgst, total_without_gst, grand_total_with_gst, self.selected_id)
            self.db_cursor.execute(query, values)
            self.db_connection.commit()

            # Update total and grand total labels
            self.update_totals()

            self.load_data()
            self.clear_form()

            self.edit_button.config(state=tk.DISABLED)
            self.delete_button.config(state=tk.DISABLED)
            self.selected_id = None

        except Exception as e:
            messagebox.showerror("Error", f"Error updating invoice: {e}")

    def delete_row(self):
        if self.selected_id is None:
            messagebox.showwarning("Delete Error", "No row selected to delete.")
            return

        confirm = messagebox.askyesno("Delete Confirmation", "Are you sure you want to delete this invoice?")
        if confirm:
            try:
                query = "DELETE FROM invoice WHERE id=%s"
                self.db_cursor.execute(query, (self.selected_id,))
                self.db_connection.commit()

                self.load_data()
                self.clear_form()
                self.selected_id = None

            except Exception as e:
                messagebox.showerror("Error", f"Error deleting invoice: {e}")

    def update_totals(self):
        total = 0.0
        grand_total = 0.0

        for row in self.table.get_children():
            values = self.table.item(row, 'values')
            if values:
                total_without_gst = float(values[11])  # Total (Without GST)
                grand_total_with_gst = float(values[12])  # Grand Total (With GST)
                total += total_without_gst
                grand_total += grand_total_with_gst

        self.total_label.config(text=f'Total: {total:.2f}')
        self.grand_total_label.config(text=f'Grand Total: {grand_total:.2f}')


 
    def generate_pdf(self):
     # Your code for generating the PDF
     search_name = self.search_name_entry.get().strip().lower()
     search_date = self.search_date_entry.get().strip()
 
     current_date = datetime.now().strftime("%Y-%m-%d")
     rows = []
     total_without_gst = 0
     grand_total_with_gst = 0
 
     # Grouping records by name (Assuming the records are in self.table)
     grouped_rows = {}
 
     # Loop through the table and filter records by search name and date
     for item in self.table.get_children():  # You would need to update this depending on your table structure
         values = self.table.item(item)['values']
         name_matches = search_name in str(values[1]).lower()  # Searching by Name (case-insensitive)
         date_matches = search_date == '' or values[3] == search_date  # Search by Date (empty date means no filter)
 
         if name_matches and date_matches:
             if values[1] not in grouped_rows:
                 grouped_rows[values[1]] = []  # Group by Name
             grouped_rows[values[1]].append(values)
 
             # Add values for total calculation
             try:
                 total_without_gst += float(values[11]) if values[11] else 0
             except ValueError:
                 messagebox.showerror("Input Error", f"Invalid value '{values[11]}' for total without GST. Please correct it.")
                 return
 
             try:
                 grand_total_with_gst += float(values[12]) if values[12] else 0
             except ValueError:
                 messagebox.showerror("Input Error", f"Invalid value '{values[12]}' for grand total with GST. Please correct it.")
                 return
 
     if not grouped_rows:
         messagebox.showwarning("No Records", "No records found for the given criteria.")
         return
 
     # Save the PDF file
     pdf_file_path = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF files", "*.pdf")])
     if pdf_file_path:
         width = 20 * inch
         height = 20 * inch
         c = canvas.Canvas(pdf_file_path, pagesize=(width, height))
 
         # Draw border around the page
         c.setStrokeColor(colors.black)
         c.setLineWidth(2)
         c.rect(20, 20, width - 40, height - 40)
 
         # Add logo if exists
         logo_path = "BRS.png"
         if os.path.exists(logo_path):
             logo_width = 300
             logo_height = 300
             logo_x = width - logo_width - 30
             logo_y = height - logo_height - 30
             c.drawImage(logo_path, logo_x, logo_y, width=logo_width, height=logo_height)
         else:
             messagebox.showerror("Error", "Logo file not found.")
 
         # Set a consistent vertical space between elements
         vertical_space = 30
         current_y = height - 100
 
         # Header
         c.setFont("Helvetica-Bold", 50)
         c.drawString(30, current_y, "Invoice")
         current_y -= vertical_space
 
         c.setFont("Helvetica", 20)
         c.drawString(30, current_y, "BHABHOR RAVINABEN SHAILESHBHAI")
         current_y -= vertical_space
 
         c.drawString(30, current_y, "Address: A484, Chandawada, Rayani Crossing, Dahod-389152, Gujarat, India")
         current_y -= vertical_space
 
         c.drawString(30, current_y, "GST No: 24QHYPS7858K1ZO")
         current_y -= vertical_space
 
         c.drawString(30, current_y, "Phone: +91 9998548565")
         current_y -= vertical_space
 
         c.drawString(30, current_y, f"Date: {current_date}")
         current_y -= vertical_space
 
         c.drawString(30, current_y, f"Customer: {search_name}")
         current_y -= vertical_space
 
         # Line separator
         c.line(30, current_y, width - 40, current_y)
         current_y -= vertical_space  # Adjust for line height
 
         # Draw each customer's table
         for customer_name, customer_data in grouped_rows.items():
             # Table Header (Exclude GST No)
             columns = ['Description', 'Date', 'Price', 'Quantity', 'GST Rate', 'Pay Method', 'CGST', 'SGST', 'Total', 'Total (With GST)']
             # We need to remove the 'GST No' from the row data, so skip the 7th column (index 7 in `values`)
             table_data = [columns] + [[row[2], row[3], row[4], row[5], row[6], row[8], row[9], row[10], row[11], row[12]]for row in customer_data]
             
             # Create the table with correct dimensions
             table = Table(table_data, colWidths=[3 * inch, 1.8 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch, 1.8 * inch, 1.5 * inch, 2 * inch, 2 * inch])  # Wider column for Description
             table.setStyle(TableStyle([ 
                 ('GRID', (0, 0), (-1, -1), 2, colors.black),  # Set grid for the table
                 ('BACKGROUND', (0, 0), (-1, 0), colors.aquamarine),  # Background color for the header
                 ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Center align all cells
                 ('FONTSIZE', (0, 0), (-1, 0), 17),  # Font size for headers
                 ('FONTSIZE', (0, 1), (-1, -1), 15),  # Font size for other rows
                 ('LEFTPADDING', (0, 0), (-1, -1), 25),  # Left padding for all cells
                 ('RIGHTPADDING', (0, 0), (-1, -1), 25), 
                 ('TOPPADDING', (0, 0), (-1, -1), 25),  # Top padding for all cells
                 ('BOTTOMPADDING', (0, 0), (-1, -1), 25),  
                 ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Set the header font to bold
             ]))
 
             # Position the table on the PDF
             table.wrapOn(c, width, height)
             table.drawOn(c, 30, current_y - 400) 
 
             # Update current_y for the next table
             current_y -= 400 + len(customer_data) * 50  
 
             # If you need to add pagination or check if the current_y exceeds the page limit, 
             # you can add a page break and reset the position.
             if current_y < 100:
                 c.showPage()
                 current_y = height - 100  # Reset the Y position to the top
 
         # Final totals
         c.setFont("Helvetica-Bold", 14)
         c.drawString(30, current_y, f"Total without GST: {total_without_gst}")
         current_y -= vertical_space
 
         c.drawString(30, current_y, f"Grand Total with GST: {grand_total_with_gst}")
 
         # Save PDF
         c.save()
 
         messagebox.showinfo("Success", f"PDF generated successfully: {pdf_file_path}")
 
 
    def on_closing(self):
        if self.db_connection:
            self.db_cursor.close()
            self.db_connection.close()
        self.master.destroy()

   
if __name__ == "__main__":
    root = tk.Tk()
    app = InvoiceFrame(root)
    app.pack(fill=tk.BOTH, expand=True)
    root.mainloop()
