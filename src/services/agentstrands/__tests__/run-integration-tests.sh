#!/bin/bash

###############################################################################
# AgentStrands Enhancement - Integration Test Runner
#
# Executes comprehensive integration testing suite including:
# - End-to-end workflow tests
# - Integration verification tests
# - Load and performance tests
# - Security and compliance tests
#
# Task: 60. Final integration testing
#
# Usage:
#   ./run-integration-tests.sh [options]
#
# Options:
#   --quick       Run quick test suite (skip load tests)
#   --load-only   Run only load tests
#   --verbose     Enable verbose output
#   --help        Show this help message
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
QUICK_MODE=false
LOAD_ONLY=false
VERBOSE=false
TEST_RESULTS_DIR="./test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --load-only)
      LOAD_ONLY=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      head -n 20 "$0" | tail -n +3 | sed 's/^# //'
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Print header
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AgentStrands Enhancement - Integration Test Suite        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Test Run: ${TIMESTAMP}${NC}"
echo ""

# Function to run test suite
run_test_suite() {
  local suite_name=$1
  local test_command=$2
  
  echo -e "${BLUE}▶ Running: ${suite_name}${NC}"
  
  if [ "$VERBOSE" = true ]; then
    eval "$test_command"
  else
    eval "$test_command" > "${TEST_RESULTS_DIR}/${suite_name}_${TIMESTAMP}.log" 2>&1
  fi
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ${suite_name} - PASSED${NC}"
    return 0
  else
    echo -e "${RED}✗ ${suite_name} - FAILED${NC}"
    echo -e "${YELLOW}  See log: ${TEST_RESULTS_DIR}/${suite_name}_${TIMESTAMP}.log${NC}"
    return 1
  fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run test suites
if [ "$LOAD_ONLY" = false ]; then
  echo -e "${YELLOW}═══ Phase 1: Unit and Integration Tests ═══${NC}"
  echo ""
  
  # Run main integration test suite
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test_suite "integration-tests" "npm test -- integration.test.ts --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Run security tests
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test_suite "security-tests" "npm test -- security.test.ts --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

if [ "$QUICK_MODE" = false ]; then
  echo -e "${YELLOW}═══ Phase 2: Load and Performance Tests ═══${NC}"
  echo ""
  
  # Run load tests with different configurations
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test_suite "load-test-light" "CONCURRENT_USERS=10 TEST_DURATION=30 ts-node src/services/agentstrands/__tests__/load-test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test_suite "load-test-medium" "CONCURRENT_USERS=50 TEST_DURATION=60 ts-node src/services/agentstrands/__tests__/load-test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test_suite "load-test-heavy" "CONCURRENT_USERS=100 TEST_DURATION=60 ts-node src/services/agentstrands/__tests__/load-test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

# Print summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo -e "${YELLOW}Next Steps:${NC}"
  echo "  1. Review test logs in ${TEST_RESULTS_DIR}"
  echo "  2. Complete UAT scenarios (see UAT_GUIDE.md)"
  echo "  3. Obtain sign-off from stakeholders"
  echo "  4. Proceed with production deployment"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo -e "${YELLOW}Action Required:${NC}"
  echo "  1. Review failed test logs in ${TEST_RESULTS_DIR}"
  echo "  2. Fix identified issues"
  echo "  3. Re-run integration tests"
  exit 1
fi
