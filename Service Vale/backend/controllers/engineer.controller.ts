import { Request, Response } from 'express';
import { db } from '../db/index';
import { engineerTable } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc } from 'drizzle-orm';

export const createEngineer = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id = uuidv4();
    
    await db.insert(engineerTable).values({
      id,
      engineerName: data.engineerName,
      address: data.address,
      contactNumber: data.contactNumber,
      email: data.email,
      city: data.city,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Engineer created successfully', 
      id 
    });
  } catch (error) {
    console.error('Error creating engineer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create engineer' 
    });
  }
};

export const getEngineers = async (req: Request, res: Response) => {
  try {
    const result = await db.select()
      .from(engineerTable)
      .orderBy(desc(engineerTable.createdAt));
    
    res.json({ 
      success: true, 
      result 
    });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch engineers' 
    });
  }
};

export const updateEngineer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    await db.update(engineerTable)
      .set({ 
        ...data, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(engineerTable.id, id));
    
    res.json({ 
      success: true, 
      message: 'Engineer updated successfully' 
    });
  } catch (error) {
    console.error('Error updating engineer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update engineer' 
    });
  }
};

export const deleteEngineer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.delete(engineerTable).where(eq(engineerTable.id, id));
    
    res.json({ 
      success: true, 
      message: 'Engineer deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting engineer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete engineer' 
    });
  }
};