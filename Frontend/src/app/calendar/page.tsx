"use client";

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calendars = [
    { id: 1, name: 'High', color: 'bg-yellow-500' },
    { id: 2, name: 'Medium', color: 'bg-blue-500' },
    { id: 3, name: 'Low', color: 'bg-green-500' },
  ];

  useEffect(() => {
    const dummyEvents = [
      { id: 1, title: 'Team Meeting', date: new Date(2023, 4, 15), calendarId: 2 },
      { id: 2, title: 'Birthday Party', date: new Date(2023, 4, 20), calendarId: 3 },
      { id: 3, title: 'Dentist Appointment', date: new Date(2023, 4, 25), calendarId: 1 },
    ];
    setEvents(dummyEvents);
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const handleSaveEvent = (newEvent) => {
    if (selectedEvent) {
      setEvents(events.map((event) => (event.id === selectedEvent.id ? newEvent : event)));
    } else {
      setEvents([...events, { ...newEvent, id: events.length + 1 }]);
    }
    setShowEventModal(false);
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === today.toDateString();
      const dayEvents = events.filter(
        (event) => event.date.toDateString() === date.toDateString()
      );

      days.push(
        <div
          key={day}
          className={`p-2 border border-gray-200 ${isToday ? 'bg-gradient-to-r from-green-400 via-green-600 to-green-800 text-white' : ''}`}
        >
          <div className="font-bold">{day}</div>
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className={`${calendars.find((cal) => cal.id === event.calendarId).color} text-white p-1 mb-1 rounded cursor-pointer`}
              onClick={() => handleEditEvent(event)}
            >
              {event.title}
            </div>
          ))}
        </div>
      );
    }
    return days;
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                  <BreadcrumbLink href="/invoice"></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMonth}
                className="bg-lime-500 p-2 rounded hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={handleNextMonth}
                className="bg-lime-500 p-2 rounded hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <FaChevronRight />
              </button>
              <button
                onClick={handleAddEvent}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="font-bold text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
          {showEventModal && (
            <EventModal
              event={selectedEvent}
              onSave={handleSaveEvent}
              onClose={() => setShowEventModal(false)}
              onDelete={handleDeleteEvent}
              calendars={calendars}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const EventModal = ({ event, onSave, onClose, onDelete, calendars }) => {
  const [title, setTitle] = useState(event ? event.title : '');
  const [date, setDate] = useState(event ? event.date.toISOString().substr(0, 10) : '');
  const [calendarId, setCalendarId] = useState(event ? event.calendarId : calendars[0].id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: event ? event.id : null, title, date: new Date(date), calendarId });
  };

  const handleDelete = () => {
    if (event) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{event ? 'Edit Event' : 'Add Event'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="date" className="block mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="calendar" className="block mb-2">
              Calendar
            </label>
            <select
              id="calendar"
              value={calendarId}
              onChange={(e) => setCalendarId(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            {event && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-lime-500 p-2 rounded hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
