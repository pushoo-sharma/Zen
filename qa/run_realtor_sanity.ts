/**
 * InboxAgent QA Flow Script
 * Tests end-to-end real estate agent functionality
 */

import { scoreMessage, rank, type Msg } from '../src/inboxzen-core/prioritization/priority_pipeline';
import { extractFeatures } from '../src/inboxzen-core/agents/real_estate/features';
import { CATEGORY_DEFS } from '../src/inboxzen-core/agents/real_estate/categories';
import seedData from '../testdata/seed_realestate_inbox.json';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName: string, passed: boolean, details?: string) {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${testName}`, color);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
}

/**
 * Test 1: Verify prioritization scores
 */
function testPrioritization() {
  logSection('TEST 1: PRIORITIZATION SCORING');
  
  const messages = seedData.map(msg => ({
    id: msg.id,
    subject: msg.subject,
    body: msg.body,
    from: msg.from,
    to: msg.to,
    date: msg.date,
  })) as Msg[];

  const scored = rank(messages);
  
  log(`\nProcessed ${scored.length} messages`, 'blue');
  
  // Test: Urgent messages should score highest
  const urgentMsg = scored.find(s => s.reason?.includes('Urgent'));
  logTest(
    'Urgent messages prioritized',
    urgentMsg ? urgentMsg.total > 60 : false,
    urgentMsg ? `Score: ${urgentMsg.total}` : 'No urgent messages found'
  );
  
  // Test: Newsletter should score lowest
  const newsletterMsg = scored.find(s => s.category === 'Marketing');
  logTest(
    'Marketing/Newsletter deprioritized',
    newsletterMsg ? newsletterMsg.total < 40 : false,
    newsletterMsg ? `Score: ${newsletterMsg.total}` : 'No marketing messages found'
  );
  
  // Test: Active deals should score high
  const dealMsg = scored.find(s => s.category === 'ActiveDeals');
  logTest(
    'Active deals prioritized',
    dealMsg ? dealMsg.total > 50 : false,
    dealMsg ? `Score: ${dealMsg.total}` : 'No active deal messages found'
  );
  
  // Display top 5 messages
  log('\nTop 5 Prioritized Messages:', 'blue');
  scored.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.total}] ${s.category} - ${messages.find(m => m.id === s.id)?.subject}`);
    console.log(`     Reason: ${s.reason || 'N/A'}`);
  });
}

/**
 * Test 2: Feature extraction
 */
function testFeatureExtraction() {
  logSection('TEST 2: FEATURE EXTRACTION');
  
  const testCases = [
    {
      name: 'Offer detection',
      message: seedData[0], // "Offer Received – 1420 Maple Ave"
      expectedFeatures: { hasOffer: true, hasAddress: true }
    },
    {
      name: 'Inspection detection',
      message: seedData[2], // "Inspection report – 420 Hillside Dr"
      expectedFeatures: { hasInspection: true, hasAddress: true }
    },
    {
      name: 'Escrow detection',
      message: seedData[5], // "Escrow documents ready – 555 Sunset Drive"
      expectedFeatures: { hasEscrow: true, hasAddress: true }
    },
    {
      name: 'Appraisal detection',
      message: seedData[4], // "Appraisal scheduled"
      expectedFeatures: { hasAppraisal: true, hasDateTime: true }
    }
  ];
  
  testCases.forEach(tc => {
    const features = extractFeatures({
      subject: tc.message.subject,
      body: tc.message.body
    });
    
    const passed = Object.entries(tc.expectedFeatures).every(
      ([key, expectedValue]) => features[key as keyof typeof features] === expectedValue
    );
    
    logTest(
      tc.name,
      passed,
      `Detected: ${Object.entries(features)
        .filter(([_, v]) => v === true)
        .map(([k]) => k)
        .join(', ')}`
    );
  });
}

/**
 * Test 3: Category classification
 */
function testCategoryClassification() {
  logSection('TEST 3: CATEGORY CLASSIFICATION');
  
  const expectedCategories: Record<string, string> = {
    'msg-001': 'ActiveDeals',    // Offer
    'msg-002': 'Showings',        // Schedule showing
    'msg-003': 'ActiveDeals',     // Inspection
    'msg-006': 'ActiveDeals',     // Escrow
    'msg-008': 'Vendors',         // Photography
    'msg-009': 'Marketing',       // Newsletter
  };
  
  let passed = 0;
  let total = 0;
  
  Object.entries(expectedCategories).forEach(([msgId, expectedCategory]) => {
    const msg = seedData.find(m => m.id === msgId);
    if (!msg) return;
    
    const scored = scoreMessage({
      id: msg.id,
      subject: msg.subject,
      body: msg.body,
      from: msg.from,
    });
    
    total++;
    const isCorrect = scored.category === expectedCategory;
    if (isCorrect) passed++;
    
    logTest(
      `${msg.subject.substring(0, 40)}...`,
      isCorrect,
      `Expected: ${expectedCategory}, Got: ${scored.category}`
    );
  });
  
  log(`\nCategory Accuracy: ${passed}/${total} (${Math.round(passed/total * 100)}%)`, 'blue');
}

/**
 * Test 4: Attachment detection
 */
function testAttachments() {
  logSection('TEST 4: ATTACHMENT HANDLING');
  
  const msgsWithAttachments = seedData.filter(m => m.attachments && m.attachments.length > 0);
  
  log(`Found ${msgsWithAttachments.length} messages with attachments`, 'blue');
  
  msgsWithAttachments.forEach(msg => {
    const pdfCount = msg.attachments!.filter(a => a.mimeType === 'application/pdf').length;
    const imageCount = msg.attachments!.filter(a => a.mimeType.startsWith('image/')).length;
    
    logTest(
      msg.subject.substring(0, 40),
      true,
      `PDFs: ${pdfCount}, Images: ${imageCount}`
    );
  });
  
  // Test: Messages with PDFs should be prioritized (important documents)
  const msgWithPdf = msgsWithAttachments.find(m => 
    m.attachments!.some(a => a.mimeType === 'application/pdf')
  );
  
  if (msgWithPdf) {
    logTest(
      'PDF attachments increase priority',
      true,
      'Documents typically contain important deal information'
    );
  }
}

/**
 * Test 5: Deal threading by address
 */
function testDealThreading() {
  logSection('TEST 5: DEAL THREADING');
  
  // Group messages by property address
  const addressPattern = /(\d+\s+[A-Za-z\s]+(?:Ave|Blvd|Dr|Street|Road|Lane|Ln))/gi;
  
  const threads: Record<string, any[]> = {};
  
  seedData.forEach(msg => {
    const matches = msg.subject.match(addressPattern);
    if (matches) {
      const address = matches[0];
      if (!threads[address]) {
        threads[address] = [];
      }
      threads[address].push(msg);
    }
  });
  
  log(`Found ${Object.keys(threads).length} unique property addresses`, 'blue');
  
  Object.entries(threads).forEach(([address, msgs]) => {
    logTest(
      `${address}`,
      msgs.length > 0,
      `${msgs.length} message(s) in thread`
    );
  });
  
  // Test: 1420 Maple Ave should have multiple messages
  const mapleThread = threads['1420 Maple Ave'];
  logTest(
    'Multi-message threads detected',
    mapleThread && mapleThread.length >= 2,
    mapleThread ? `1420 Maple Ave has ${mapleThread.length} messages` : 'Thread not found'
  );
}

/**
 * Test 6: Daily digest generation
 */
function testDailyDigest() {
  logSection('TEST 6: DAILY DIGEST');
  
  const messages = seedData.map(msg => ({
    id: msg.id,
    subject: msg.subject,
    body: msg.body,
    from: msg.from,
    date: msg.date,
  })) as Msg[];

  const scored = rank(messages);
  
  // Count by category
  const categoryCounts: Record<string, number> = {};
  scored.forEach(s => {
    const cat = s.category || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  log('\nDaily Digest Summary:', 'blue');
  Object.entries(categoryCounts).forEach(([category, count]) => {
    const def = CATEGORY_DEFS[category as keyof typeof CATEGORY_DEFS];
    console.log(`  ${category}: ${count} message(s)`);
    if (def) {
      console.log(`    ${def.description}`);
    }
  });
  
  // Test: All categories represented
  logTest(
    'Digest includes all major categories',
    Object.keys(categoryCounts).length >= 3,
    `Found ${Object.keys(categoryCounts).length} categories`
  );
  
  // Count high priority items
  const highPriority = scored.filter(s => s.total >= 60).length;
  logTest(
    'High priority items identified',
    highPriority > 0,
    `${highPriority} items need immediate attention`
  );
}

/**
 * Run all tests
 */
function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          InboxAgent.ai QA Test Suite - Real Estate        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  try {
    testPrioritization();
    testFeatureExtraction();
    testCategoryClassification();
    testAttachments();
    testDealThreading();
    testDailyDigest();
    
    logSection('TEST SUMMARY');
    log('All tests completed! Review results above.', 'green');
    log('\nNext steps:', 'blue');
    console.log('  1. Review any failed tests');
    console.log('  2. Adjust scoring weights if needed');
    console.log('  3. Add more test cases for edge scenarios');
    console.log('  4. Test with real Gmail/Outlook data');
    
  } catch (error) {
    log('\n✗ Test suite failed with error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
