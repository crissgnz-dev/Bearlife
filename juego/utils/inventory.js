export let inventory = {};
let inventorySlots = [];
let inventoryBackground;
const inventorySlotSize = 30;

export function getInventorySlots() {
    return inventorySlots;
}

export function getInventoryBackground() {
    return inventoryBackground;
}

export function setInventoryBackground(bg) {
    inventoryBackground = bg;
}

export function addItemToInventory(scene, itemKey) {
  console.log(`Añadiendo ítem: ${itemKey}`);
  if (inventory[itemKey]) {
    inventory[itemKey].quantity++;
    inventory[itemKey].quantityText.setText(inventory[itemKey].quantity);
  } else {
    const emptySlot = inventorySlots.find((slot) => slot.isEmpty);

    if (emptySlot) {
      const item = scene.add
        .image(emptySlot.x, emptySlot.y, itemKey)
        .setOrigin(0.5)
        .setInteractive()
        .setScale(0.7);
      item.itemKey = itemKey;
      item.setVisible(true); // Assuming visible if inventory is open, or handled by toggle

      item.on("pointerdown", function (pointer) {
        scene.input.setDraggable(item);
        item.setTint(0xff00ff);
      });

      scene.input.on("drag", function (pointer, gameObject, dragX, dragY) {
        // Simple drag check
        gameObject.x = dragX;
        gameObject.y = dragY;
      });

      scene.input.on("dragend", function (pointer, gameObject) {
        const closestSlot = getClosestSlot(gameObject.x, gameObject.y);
        gameObject.clearTint();
        if (closestSlot) {
          gameObject.x = closestSlot.x;
          gameObject.y = closestSlot.y;

          inventorySlots.forEach((slot) => {
            if (slot.item === gameObject) {
              slot.item = null;
              slot.isEmpty = true;
            }
          });

          closestSlot.item = gameObject;
          closestSlot.isEmpty = false;
        } else {
          const originalSlot = inventory[gameObject.itemKey]?.slot; 
          // Note: Logic in game.js seemed to rely on re-finding slot. 
          // For simplicity, snapping back to where it was if no slot found logic is improved:
          // In original code, it didn't strictly save 'slot' in inventory object efficiently.
          // We will snap back to the slot that holds it currently? 
          // Re-running find again for now to match behavior or fix.
          
          // Fix: Find the slot this item currently belongs to (before drag logic mess up)
           const currentSlot = inventorySlots.find(s => s.item === gameObject);
           if(currentSlot) {
               gameObject.x = currentSlot.x;
               gameObject.y = currentSlot.y;
           }
        }
      });

      const quantityText = scene.add.text(emptySlot.x, emptySlot.y, "1", {
        fontSize: "10px",
        fill: "#fff",
      });
      quantityText.setOrigin(1, -0.6);
      quantityText.setVisible(true);

      inventory[itemKey] = {
        item: item,
        quantity: 1,
        quantityText: quantityText,
        // We probably want to store slot ref here if needed
      };

      emptySlot.item = item;
      emptySlot.isEmpty = false;
      
      // If inventory is currently hidden, hide the new item
      if (!inventoryBackground.visible) {
          item.setVisible(false);
          quantityText.setVisible(false);
      }

    } else {
      console.log("No hay espacio en el inventario");
    }
  }
}

export function getClosestSlot(x, y) {
  let closestSlot = null;
  let minDistance = Infinity;

  inventorySlots.forEach((slot) => {
    const distance = Phaser.Math.Distance.Between(x, y, slot.x, slot.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestSlot = slot;
    }
  });

  return closestSlot;
}

export function createInventorySlots(scene) {
  const rows = 3;
  const cols = 5;
  const startX =
    inventoryBackground.x -
    (cols / 2) * inventorySlotSize +
    inventorySlotSize / 2;
  const startY =
    inventoryBackground.y -
    (rows / 2) * inventorySlotSize +
    inventorySlotSize / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * inventorySlotSize;
      const y = startY + row * inventorySlotSize;

      const slot = scene.add.rectangle(
        x,
        y,
        inventorySlotSize - 4,
        inventorySlotSize - 4,
        0x000000,
        0.2
      );
      slot.setStrokeStyle(1, 0xffffff);
      slot.setVisible(false);

      inventorySlots.push({
        x: x,
        y: y,
        item: null,
        isEmpty: true,
        slotRect: slot,
        col: col,
        row: row,
      });
    }
  }

  inventoryBackground.displayWidth = cols * inventorySlotSize + 10;
  inventoryBackground.displayHeight = rows * inventorySlotSize + 10;
}

export function toggleInventoryVisibility(visible) {
  inventoryBackground.setVisible(visible);
  inventorySlots.forEach((slot) => {
    slot.slotRect.setVisible(visible);
    if (slot.item) {
      slot.item.setVisible(visible);
      inventory[slot.item.itemKey].quantityText.setVisible(visible);
    }
  });
}

export function updateInventoryPositions(playerX, playerY) {
    if(inventoryBackground && inventoryBackground.visible) {
        inventoryBackground.setPosition(playerX, playerY);
        inventorySlots.forEach((slot) => {
            slot.slotRect.x = slot.x = inventoryBackground.x - (inventorySlotSize * 2) + slot.col * inventorySlotSize;
            slot.slotRect.y = slot.y = inventoryBackground.y - inventorySlotSize + slot.row * inventorySlotSize;
        
            if (slot.item) {
                slot.item.x = slot.x;
                slot.item.y = slot.y;
                const itemKey = slot.item.itemKey;
                if (inventory[itemKey]) {
                    inventory[itemKey].quantityText.x = slot.x + inventorySlotSize / 2 - 10;
                    inventory[itemKey].quantityText.y = slot.y + inventorySlotSize / 2 - 20;
                }
            }
        });
    }
}
