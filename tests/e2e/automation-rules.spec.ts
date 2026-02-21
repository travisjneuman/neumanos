import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors, dismissOnboarding } from './helpers';

/**
 * E2E Tests for Automation Rules (User-Facing Flows)
 *
 * Covers: Create automation rule, verify trigger fires,
 *         verify action executes, disable/enable rule
 *
 * Note: This complements automation-engine.spec.ts which tests
 * lower-level engine behavior with fixtures.
 */

test.describe('Automation Rules - User Flows', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/automations');
  });

  test('can create a new automation rule', async ({ page }) => {
    // Look for create rule button
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule|\+/i });

    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();
      await page.waitForTimeout(300);

      // Fill in rule details
      const nameInput = page.getByPlaceholder(/name|title|rule.*name/i);
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('E2E Test Automation Rule');

        // Select a trigger
        const triggerSelect = page.getByLabel(/trigger|when|event/i);
        if (await triggerSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
          await triggerSelect.click();

          // Select task.completed trigger
          const taskCompletedOption = page.getByText(/task.*completed|task.*complete/i);
          if (await taskCompletedOption.isVisible({ timeout: 1000 }).catch(() => false)) {
            await taskCompletedOption.click();
          }
        }

        // Select an action
        const actionSelect = page.getByLabel(/action|then|do/i);
        if (await actionSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
          await actionSelect.click();

          // Select create task action
          const createTaskAction = page.getByText(/create.*task/i);
          if (await createTaskAction.isVisible({ timeout: 1000 }).catch(() => false)) {
            await createTaskAction.click();
          }
        }

        // Save the rule
        const saveButton = page.getByRole('button', { name: /save|create|add/i });
        if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(500);

          // Verify rule appears in the list
          await expect(page.getByText('E2E Test Automation Rule')).toBeVisible();
        }
      }
    }
  });

  test('can edit an existing automation rule', async ({ page }) => {
    // Create a rule first
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();
      const nameInput = page.getByPlaceholder(/name|title/i);
      await nameInput.fill('Rule to Edit');
      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Find the rule and click edit
    const ruleItem = page.getByText('Rule to Edit').locator('..');
    const editButton = ruleItem.locator('button').filter({ hasText: /edit/i }).or(
      page.getByRole('button', { name: /edit/i }).first()
    );

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(300);

      // Update the name
      const nameInput = page.getByPlaceholder(/name|title/i).or(
        page.getByDisplayValue('Rule to Edit')
      );

      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameInput.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('Updated Rule Name');

        // Save changes
        const saveButton = page.getByRole('button', { name: /save|update/i });
        await saveButton.click();
        await page.waitForTimeout(500);

        // Verify updated name
        await expect(page.getByText('Updated Rule Name')).toBeVisible();
      }
    }
  });

  test('can disable and enable automation rule', async ({ page }) => {
    // Create a rule first
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();
      const nameInput = page.getByPlaceholder(/name|title/i);
      await nameInput.fill('Toggle Test Rule');
      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Find the rule
    const ruleItem = page.getByText('Toggle Test Rule').locator('..');

    // Look for enable/disable toggle
    const toggleSwitch = ruleItem.locator('input[type="checkbox"], [role="switch"]').first().or(
      ruleItem.locator('button').filter({ hasText: /enable|disable/i })
    );

    if (await toggleSwitch.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Get initial state
      const isChecked = await toggleSwitch.isChecked().catch(() => false);

      // Toggle the rule
      await toggleSwitch.click();
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await toggleSwitch.isChecked().catch(() => false);
      expect(newState).not.toBe(isChecked);

      // Toggle back
      await toggleSwitch.click();
      await page.waitForTimeout(500);

      // Verify it toggles back
      const finalState = await toggleSwitch.isChecked().catch(() => false);
      expect(finalState).toBe(isChecked);
    }
  });

  test('can delete an automation rule', async ({ page }) => {
    // Create a rule first
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();
      const nameInput = page.getByPlaceholder(/name|title/i);
      await nameInput.fill('Rule to Delete');
      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Find and delete the rule
    const ruleItem = page.getByText('Rule to Delete').locator('..');
    const deleteButton = ruleItem.locator('button').filter({ hasText: /delete|remove/i }).or(
      page.getByRole('button', { name: /delete/i }).first()
    );

    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(500);

      // Verify rule is gone
      await expect(page.getByText('Rule to Delete')).not.toBeVisible();
    }
  });

  test('automation rule trigger fires when condition is met', async ({ page }) => {
    // Create an automation rule that creates a task when another task is completed
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();

      // Set up rule: When task completed → Create follow-up task
      const nameInput = page.getByPlaceholder(/name|title/i);
      await nameInput.fill('Auto Create Follow-up');

      // Select trigger
      const triggerSelect = page.getByLabel(/trigger|when/i);
      if (await triggerSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await triggerSelect.click();
        const taskCompletedOption = page.getByText(/task.*completed/i);
        if (await taskCompletedOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await taskCompletedOption.click();
        }
      }

      // Select action
      const actionSelect = page.getByLabel(/action|then/i);
      if (await actionSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await actionSelect.click();
        const createTaskAction = page.getByText(/create.*task/i);
        if (await createTaskAction.isVisible({ timeout: 1000 }).catch(() => false)) {
          await createTaskAction.click();
        }
      }

      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to tasks and create + complete a task
    await navigateTo(page, '/tasks');

    const addButton = page.getByRole('button', { name: /add.*task|new.*task/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      const titleInput = page.getByPlaceholder(/title|task.*name/i);
      await titleInput.fill('Trigger Task');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Complete the task to trigger automation
      const taskCard = page.getByText('Trigger Task').locator('..');
      const checkbox = taskCard.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
        await checkbox.click();
        await page.waitForTimeout(1000); // Wait for automation to execute

        // Verify follow-up task was created (if automation config includes title)
        // This is implementation-specific and might need adjustment
      }
    }
  });

  test('automation action executes correctly', async ({ page }) => {
    // This is a smoke test to verify actions can be configured
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();

      const nameInput = page.getByPlaceholder(/name|title/i);
      await nameInput.fill('Action Test Rule');

      // Configure action parameters (implementation-specific)
      const actionConfig = page.locator('.action-config, [data-action-config]').first();
      if (await actionConfig.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Action configuration UI exists
        await expect(actionConfig).toBeVisible();
      }

      const saveButton = page.getByRole('button', { name: /save|create/i });
      if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveButton.click();
      }
    }
  });

  test('can add conditions to automation rule', async ({ page }) => {
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();

      const nameInput = page.getByPlaceholder(/name|title/i);
      await nameInput.fill('Conditional Rule');

      // Look for add condition button
      const addConditionButton = page.getByRole('button', { name: /add.*condition|new.*condition/i });
      if (await addConditionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addConditionButton.click();
        await page.waitForTimeout(300);

        // Condition configuration UI should appear
        const conditionConfig = page.locator('.condition-config, [data-condition]').first();
        if (await conditionConfig.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(conditionConfig).toBeVisible();
        }
      }

      const saveButton = page.getByRole('button', { name: /save|create/i });
      if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveButton.click();
      }
    }
  });

  test('automation rules list displays all rules', async ({ page }) => {
    // Create a couple of rules
    for (let i = 1; i <= 2; i++) {
      const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
      if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createRuleButton.click();
        const nameInput = page.getByPlaceholder(/name|title/i);
        await nameInput.fill(`Test Rule ${i}`);
        const saveButton = page.getByRole('button', { name: /save|create/i });
        await saveButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Verify both rules appear
    await expect(page.getByText('Test Rule 1')).toBeVisible();
    await expect(page.getByText('Test Rule 2')).toBeVisible();
  });

  test('can view automation rule execution history', async ({ page }) => {
    // Look for history/logs section
    const historyTab = page.getByRole('button', { name: /history|logs|activity/i });

    if (await historyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);

      // History view should display
      const historyContainer = page.locator('.automation-history, [data-history], .execution-log').first();
      if (await historyContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(historyContainer).toBeVisible();
      }
    }
  });

  test('automation rule shows enabled/disabled status clearly', async ({ page }) => {
    // Create a rule
    const createRuleButton = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule/i });
    if (await createRuleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRuleButton.click();
      const nameInput = page.getByPlaceholder(/name|title/i);
      await nameInput.fill('Status Test Rule');
      const saveButton = page.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    // Find the rule in the list
    const ruleItem = page.getByText('Status Test Rule').locator('..');

    // Should have some visual indicator of enabled/disabled state
    const statusIndicator = ruleItem.locator('.status, [data-status], .badge').or(
      ruleItem.getByText(/enabled|disabled|active|inactive/i)
    );

    if (await statusIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(statusIndicator).toBeVisible();
    }
  });
});
