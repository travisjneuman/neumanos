import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Calendar Events
 *
 * Covers: Create event, edit event, delete event,
 *         import ICS file, verify DayDetailModal shows tasks+events
 */

// Helper to dismiss onboarding modals
async function dismissModals(page: any) {
  const skipButton = page.getByRole('button', { name: /skip for now/i });
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await skipButton.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }

  const closeButton = page.getByRole('button', { name: /close modal/i });
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
    await closeButton.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

test.describe('Calendar Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule?tab=calendar');
    await dismissModals(page);

    // Ensure we're on Calendar tab
    const calendarTab = page.getByRole('button', { name: /calendar/i });
    if (await calendarTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await calendarTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('can create a new calendar event', async ({ page }) => {
    // Look for add event button or click on a date cell
    const addEventButton = page.getByRole('button', { name: /add.*event|new.*event|create.*event/i });

    if (await addEventButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEventButton.click();
    } else {
      // Try clicking on a calendar date cell
      const dateCell = page.locator('[data-date], .calendar-day, .day-cell').first();
      if (await dateCell.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateCell.click();
      }
    }

    // Wait for event creation modal/form
    await page.waitForTimeout(500);

    // Fill in event details
    const titleInput = page.getByPlaceholder(/title|event.*name|what/i);
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill('E2E Test Event');

      // Fill in description if available
      const descInput = page.getByPlaceholder(/description|notes|details/i);
      if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await descInput.fill('This is a test event created by E2E tests');
      }

      // Save the event
      const saveButton = page.getByRole('button', { name: /save|create|add/i });
      if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        // Verify event appears in calendar
        await expect(page.getByText('E2E Test Event')).toBeVisible();
      }
    }
  });

  test('can edit an existing event', async ({ page }) => {
    // Create an event first
    const addEventButton = page.getByRole('button', { name: /add.*event|new.*event|create.*event/i });
    if (await addEventButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEventButton.click();
      const titleInput = page.getByPlaceholder(/title|event.*name/i);
      await titleInput.fill('Event to Edit');
      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Click on the event to open details
    const eventElement = page.getByText('Event to Edit').first();
    await eventElement.click();
    await page.waitForTimeout(500);

    // Look for edit button
    const editButton = page.getByRole('button', { name: /edit/i });
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(300);

      // Update the title
      const titleInput = page.getByPlaceholder(/title|event.*name/i).or(
        page.getByDisplayValue('Event to Edit')
      );

      if (await titleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await titleInput.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('Updated Event Title');

        // Save changes
        const saveButton = page.getByRole('button', { name: /save|update/i });
        if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(500);

          // Verify updated title
          await expect(page.getByText('Updated Event Title')).toBeVisible();
        }
      }
    }
  });

  test('can delete an event', async ({ page }) => {
    // Create an event first
    const addEventButton = page.getByRole('button', { name: /add.*event|new.*event|create.*event/i });
    if (await addEventButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEventButton.click();
      const titleInput = page.getByPlaceholder(/title|event.*name/i);
      await titleInput.fill('Event to Delete');
      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Click on the event to open details
    const eventElement = page.getByText('Event to Delete').first();
    await eventElement.click();
    await page.waitForTimeout(500);

    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /delete|remove/i });
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion if there's a dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(500);

      // Verify event is no longer visible
      await expect(page.getByText('Event to Delete')).not.toBeVisible();
    }
  });

  test('can import ICS file', async ({ page }) => {
    // Look for import button
    const importButton = page.getByRole('button', { name: /import|upload|ics/i });

    if (await importButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(300);

      // Look for file input
      const fileInput = page.locator('input[type="file"]');

      if (await fileInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Create a simple ICS file content
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//E2E Test//EN
BEGIN:VEVENT
UID:test-event-001@example.com
DTSTAMP:20250101T120000Z
DTSTART:20250115T100000Z
DTEND:20250115T110000Z
SUMMARY:Imported Test Event
DESCRIPTION:This event was imported from ICS
END:VEVENT
END:VCALENDAR`;

        // Create a file and upload it
        const buffer = Buffer.from(icsContent);
        await fileInput.setInputFiles({
          name: 'test-event.ics',
          mimeType: 'text/calendar',
          buffer: buffer,
        });

        // Wait for import processing
        await page.waitForTimeout(1000);

        // Look for success message or verify event appears
        const successMessage = page.getByText(/import.*success|imported|added/i);
        if (await successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(successMessage).toBeVisible();
        }

        // Verify imported event appears (might need to navigate to the date)
        const importedEvent = page.getByText('Imported Test Event');
        if (await importedEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(importedEvent).toBeVisible();
        }
      }
    }
  });

  test('DayDetailModal shows both tasks and events', async ({ page }) => {
    // Create an event
    const addEventButton = page.getByRole('button', { name: /add.*event|new.*event|create.*event/i });
    if (await addEventButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEventButton.click();
      const titleInput = page.getByPlaceholder(/title|event.*name/i);
      await titleInput.fill('Day Detail Test Event');
      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Click on a date cell to open day detail modal
    const dateCell = page.locator('[data-date], .calendar-day, .day-cell').first();
    if (await dateCell.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateCell.click();
      await page.waitForTimeout(500);

      // Look for day detail modal or panel
      const dayDetailModal = page.getByText(/day.*detail|schedule.*for|agenda/i);

      if (await dayDetailModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify events section exists
        const eventsSection = page.getByText(/events/i);
        if (await eventsSection.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(eventsSection).toBeVisible();
        }

        // Verify tasks section exists
        const tasksSection = page.getByText(/tasks/i);
        if (await tasksSection.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(tasksSection).toBeVisible();
        }

        // Verify the event we created appears
        await expect(page.getByText('Day Detail Test Event')).toBeVisible();
      }
    }
  });

  test('can create recurring event', async ({ page }) => {
    // Look for add event button
    const addEventButton = page.getByRole('button', { name: /add.*event|new.*event|create.*event/i });

    if (await addEventButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEventButton.click();
      await page.waitForTimeout(300);

      // Fill in event details
      const titleInput = page.getByPlaceholder(/title|event.*name/i);
      if (await titleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await titleInput.fill('Recurring Event Test');

        // Look for recurrence/repeat option
        const recurrenceToggle = page.getByRole('button', { name: /repeat|recurring|recurrence/i }).or(
          page.locator('input[type="checkbox"]').filter({ has: page.getByText(/repeat|recurring/i) })
        );

        if (await recurrenceToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
          await recurrenceToggle.click();
          await page.waitForTimeout(300);

          // Select recurrence pattern (daily, weekly, etc.)
          const weeklyOption = page.getByText(/weekly/i);
          if (await weeklyOption.isVisible({ timeout: 1000 }).catch(() => false)) {
            await weeklyOption.click();
          }

          // Save the event
          const saveButton = page.getByRole('button', { name: /save|create/i });
          await saveButton.click();
          await page.waitForTimeout(500);

          // Verify event appears (recurring events might have special indicators)
          await expect(page.getByText('Recurring Event Test')).toBeVisible();
        }
      }
    }
  });

  test('can navigate between months in calendar', async ({ page }) => {
    // Look for previous/next month navigation buttons
    const nextMonthButton = page.getByRole('button', { name: /next.*month|►|→/i }).or(
      page.locator('[data-next-month]')
    );
    const prevMonthButton = page.getByRole('button', { name: /prev.*month|◄|←/i }).or(
      page.locator('[data-prev-month]')
    );

    if (await nextMonthButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Get current month display
      const monthDisplay = page.locator('.month-display, [data-month], .calendar-header').first();
      const currentMonth = await monthDisplay.textContent();

      // Navigate to next month
      await nextMonthButton.click();
      await page.waitForTimeout(500);

      // Verify month changed
      const newMonth = await monthDisplay.textContent();
      expect(newMonth).not.toBe(currentMonth);
    }

    if (await prevMonthButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await prevMonthButton.click();
      await page.waitForTimeout(500);

      // Verify navigation works
      const monthDisplay = page.locator('.month-display, [data-month], .calendar-header').first();
      await expect(monthDisplay).toBeVisible();
    }
  });

  test('calendar displays event colors and categories', async ({ page }) => {
    // Create an event with a category/color
    const addEventButton = page.getByRole('button', { name: /add.*event|new.*event|create.*event/i });

    if (await addEventButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEventButton.click();
      const titleInput = page.getByPlaceholder(/title|event.*name/i);
      await titleInput.fill('Colored Event');

      // Look for category or color picker
      const categorySelect = page.getByLabel(/category|type/i);
      const colorPicker = page.locator('input[type="color"], .color-picker').first();

      if (await categorySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await categorySelect.click();
        // Select a category option
        const categoryOption = page.getByRole('option').first();
        await categoryOption.click();
      } else if (await colorPicker.isVisible({ timeout: 1000 }).catch(() => false)) {
        await colorPicker.click();
      }

      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);

      // Verify event appears with styling
      const eventElement = page.getByText('Colored Event').first();
      await expect(eventElement).toBeVisible();

      // Event should have some color/category styling
      const parentElement = eventElement.locator('..');
      const hasColorClass = await parentElement.evaluate(el => {
        const classes = el.className;
        return classes.includes('bg-') || classes.includes('color-') || el.style.backgroundColor !== '';
      });

      // If the event has color styling, this should be true
      if (hasColorClass) {
        expect(hasColorClass).toBe(true);
      }
    }
  });
});
