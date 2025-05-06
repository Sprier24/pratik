import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk, ImageFile
import os
import mysql.connector

ImageFile.LOAD_TRUNCATED_IMAGES = True

class BillManagerFrame(tk.Frame):
    def __init__(self, root):
        super().__init__(root)
        self.configure(bg="white")
        self.images = [] 
        self.image_labels = [] 
        self.selected_images = set() 
        self.db = mysql.connector.connect(
            host="localhost",
            user="root",  
            password="root123",  
            database="dailywages sunday",  
        )
        self.cursor = self.db.cursor()
        self.images_per_row = 4
        self.button_frame = tk.Frame(self, bg="lightgrey", borderwidth=2, relief="groove")
        self.button_frame.pack(side=tk.TOP, fill=tk.X)
        self.upload_button = tk.Button(
            self.button_frame,
            text="Upload Bills",
            command=self.upload_bills,
            width=20,
            height=2,
            bg="lightblue"
        )
        self.upload_button.pack(side=tk.LEFT, padx=5)
        self.delete_selected_button = tk.Button(
            self.button_frame,
            text="Delete Selected",
            command=self.delete_selected_images,
            width=20,
            height=2,
            bg="lightblue"
        )
        self.delete_selected_button.pack(side=tk.LEFT, padx=5)
        self.canvas_frame = tk.Frame(self)
        self.canvas_frame.pack(fill=tk.BOTH, expand=True)
        self.canvas = tk.Canvas(self.canvas_frame, bg="white")
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.scrollbar_y = tk.Scrollbar(self.canvas_frame, orient="vertical", command=self.canvas.yview)
        self.scrollbar_y.pack(side=tk.RIGHT, fill=tk.Y)
        self.canvas.config(yscrollcommand=self.scrollbar_y.set)
        self.image_frame = tk.Frame(self.canvas, bg="white")
        self.canvas.create_window((0, 0), window=self.image_frame, anchor="nw")
        self.image_frame.bind("<Configure>", self.on_frame_configure)
        self.load_bills_from_db()

    def upload_bills(self):
        file_paths = filedialog.askopenfilenames(filetypes=[("Image Files", "*.png;*.jpg;*.jpeg")])
        if file_paths:
            for file_path in file_paths:
                if file_path not in self.images:
                    self.images.append(file_path)
                    self.display_image(file_path)
                    self.save_bill_to_db(file_path)

    def save_bill_to_db(self, file_path):
        try:
            sql = "INSERT INTO bills (file_path) VALUES (%s)"
            self.cursor.execute(sql, (file_path,))
            self.db.commit()
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Failed to save bill to database: {err}")

    def load_bills_from_db(self):
        try:
            self.cursor.execute("SELECT file_path FROM bills") 
            results = self.cursor.fetchall()
            for (file_path,) in results:
                self.images.append(file_path)
                self.display_image(file_path)
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Failed to load bill from database: {err}")

    def display_image(self, file_path):
        image = Image.open(file_path)
        image.thumbnail((350, 350)) 
        photo = ImageTk.PhotoImage(image)
        image_frame = tk.Frame(self.image_frame, bg="white")
        index = len(self.image_labels)  
        row = index // self.images_per_row  
        column = index % self.images_per_row  
        image_frame.grid(row=row, column=column, padx=5, pady=5)
        select_var = tk.BooleanVar()
        checkbox = tk.Checkbutton(image_frame, variable=select_var, command=lambda: self.toggle_selection(file_path))
        checkbox.pack()
        label = tk.Label(image_frame, image=photo, cursor="hand2", bg="white")
        label.image = photo
        label.pack()
        label.bind("<Button-1>", lambda e: self.open_image(file_path))
        self.image_labels.append((file_path, image_frame))

    def open_image(self, file_path):
        """Open the selected image using the default viewer."""
        try:
            os.startfile(file_path)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open image: {e}")

    def toggle_selection(self, file_path):
        if file_path in self.selected_images:
            self.selected_images.remove(file_path)
        else:
            self.selected_images.add(file_path)

    def delete_selected_images(self):
        if not self.selected_images:
            messagebox.showwarning("Warning", "No images selected to delete")
            return
        confirm = messagebox.askyesno("Confirm Deletion", "Are you sure you want to delete the selected images from the database?")
        if confirm:
            for file_path in self.selected_images:
                if file_path in self.images:
                    self.images.remove(file_path)
                    self.delete_bill_from_db(file_path) 
            self.selected_images.clear()  
            self.refresh_image_grid()
            messagebox.showinfo("Info", "Selected images removed from the database successfully")

    def delete_bill_from_db(self, file_path):
        try:
            sql = "DELETE FROM bills WHERE file_path = %s"
            self.cursor.execute(sql, (file_path,))
            self.db.commit()
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Failed to delete bill from database: {err}")

    def refresh_image_grid(self):
        for _, image_frame in self.image_labels:
            image_frame.destroy()
        self.image_labels.clear()  
        for file_path in self.images:
            self.display_image(file_path)

    def on_frame_configure(self, event):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Bill Manager")
    BillManagerFrame(root).pack(fill=tk.BOTH, expand=True)
    root.mainloop()
