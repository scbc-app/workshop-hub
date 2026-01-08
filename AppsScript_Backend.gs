
/**
 * SHIFTPRO ENTERPRISE - UNIVERSAL LEDGER CONTROLLER
 * Version: 4.2.3 - Date Formatting Optimization & Persistence
 */

function doGet(e) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "MASTER_DATABASE_JSON";
  const cachedData = cache.get(cacheKey);
  
  if (cachedData != null) {
    return ContentService.createTextOutput(cachedData)
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const data = {};
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    const values = sheet.getDataRange().getValues();
    if (values.length > 1) {
      const headers = values[0];
      const validRows = values.slice(1).filter(row => {
        return row[0] !== "" && row[0] !== null && row[0] !== undefined && String(row[0]).trim() !== "";
      });

      data[name] = validRows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          let val = row[i];
          if (val instanceof Date) {
            // PROFESSIONAL SCRUB: Remove time components from all system date objects
            val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
          }
          obj[header] = val;
        });
        return obj;
      });
    } else {
      data[name] = [];
    }
  });
  
  const jsonString = JSON.stringify(data);
  cache.put(cacheKey, jsonString, 20); 
  
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return error("System is under high load. Transaction timed out."); 
  
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = body.action || 'create';
    
    if (action === 'delete') {
      const targetId = normalizeId(body.id);
      const affectedSheets = ['Staff_Registry', 'Staff_Credentials', 'Tools_Master'];
      let totalPurged = 0;

      affectedSheets.forEach(sName => {
        const sheet = ss.getSheetByName(sName);
        if (sheet) {
          const data = sheet.getDataRange().getValues();
          for (let i = data.length - 1; i >= 1; i--) {
            if (normalizeId(data[i][0]) === targetId) {
              sheet.deleteRow(i + 1);
              totalPurged++;
            }
          }
        }
      });

      clearSystemCache();
      return success({ action: 'cascading_delete', purgedRows: totalPurged });
    }

    let sheet = ss.getSheetByName(body.sheet);
    if (!sheet) throw new Error("Target Sheet '" + body.sheet + "' not found.");
    
    if (action === 'clear') {
       if (sheet.getLastRow() > 1) {
           sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
       }
    } else if (action === 'create') {
      sheet.appendRow(body.row);
    } else if (action === 'batchCreate') {
      if (body.rows && body.rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, body.rows.length, body.rows[0].length).setValues(body.rows);
      }
    } else if (action === 'update') {
      const targetId = normalizeId(body.id);
      const data = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (normalizeId(data[i][0]) === targetId) {
          sheet.getRange(i + 1, 1, 1, body.row.length).setValues([body.row]);
          found = true;
          break;
        }
      }
      if (!found) sheet.appendRow(body.row);
    }

    clearSystemCache();
    return success({ action: action, success: true });
      
  } catch(err) {
    return error(err.toString());
  } finally {
    lock.releaseLock();
  }
}

function normalizeId(val) {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function clearSystemCache() {
  const cache = CacheService.getScriptCache();
  cache.remove("MASTER_DATABASE_JSON");
}

function success(payload) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", ...payload 
  })).setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "error", message: msg 
  })).setMimeType(ContentService.MimeType.JSON);
}
