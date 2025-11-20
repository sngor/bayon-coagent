import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Hub Components Spacing', () => {
  describe('HubLayout Component', () => {
    it('should verify hub-layout uses space-y-6', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-layout.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('space-y-6');
    });

    it('should use Framer Motion for animations like StandardPageLayout', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-layout.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('motion');
      expect(content).toContain('AnimatePresence');
    });
  });

  describe('HubHeader Component', () => {
    it('should use gap-4 for header element spacing', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-header.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('gap-4');
    });

    it('should use mt-2 for description spacing', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-header.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('mt-2');
    });

    it('should have title, description, and actions structure like StandardPageLayout', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-header.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('title');
      expect(content).toContain('description');
      expect(content).toContain('actions');
    });
  });

  describe('HubTabs Component', () => {
    it('should use gap-2 for tab spacing', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-tabs.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('gap-2');
    });

    it('should have proper ARIA attributes', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-tabs.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('aria-selected');
      expect(content).toContain('aria-controls');
      expect(content).toContain('role="tab"');
      expect(content).toContain('role="tablist"');
    });
  });

  describe('Consistency with StandardPageLayout', () => {
    it('should use the same default spacing (space-y-6) as StandardPageLayout', () => {
      const hubLayoutPath = path.join(process.cwd(), 'src/components/hub/hub-layout.tsx');
      const standardLayoutPath = path.join(process.cwd(), 'src/components/standard/page-layout.tsx');
      
      const hubContent = fs.readFileSync(hubLayoutPath, 'utf-8');
      const standardContent = fs.readFileSync(standardLayoutPath, 'utf-8');
      
      // Both should use space-y-6 as default spacing
      expect(hubContent).toContain('space-y-6');
      expect(standardContent).toContain('space-y-6');
    });

    it('should use Framer Motion animations like StandardPageLayout', () => {
      const hubLayoutPath = path.join(process.cwd(), 'src/components/hub/hub-layout.tsx');
      const standardLayoutPath = path.join(process.cwd(), 'src/components/standard/page-layout.tsx');
      
      const hubContent = fs.readFileSync(hubLayoutPath, 'utf-8');
      const standardContent = fs.readFileSync(standardLayoutPath, 'utf-8');
      
      // Both should use motion components
      expect(hubContent).toContain('motion');
      expect(standardContent).toContain('motion');
    });

    it('should have similar header structure (title, description, actions)', () => {
      const hubHeaderPath = path.join(process.cwd(), 'src/components/hub/hub-header.tsx');
      const standardLayoutPath = path.join(process.cwd(), 'src/components/standard/page-layout.tsx');
      
      const hubContent = fs.readFileSync(hubHeaderPath, 'utf-8');
      const standardContent = fs.readFileSync(standardLayoutPath, 'utf-8');
      
      // Both should have title, description, and actions
      expect(hubContent).toContain('title');
      expect(hubContent).toContain('description');
      expect(hubContent).toContain('actions');
      
      expect(standardContent).toContain('title');
      expect(standardContent).toContain('description');
      expect(standardContent).toContain('actions');
    });

    it('should follow the standard spacing scale', () => {
      const hubLayoutPath = path.join(process.cwd(), 'src/components/hub/hub-layout.tsx');
      const hubHeaderPath = path.join(process.cwd(), 'src/components/hub/hub-header.tsx');
      const hubTabsPath = path.join(process.cwd(), 'src/components/hub/hub-tabs.tsx');
      
      const layoutContent = fs.readFileSync(hubLayoutPath, 'utf-8');
      const headerContent = fs.readFileSync(hubHeaderPath, 'utf-8');
      const tabsContent = fs.readFileSync(hubTabsPath, 'utf-8');
      
      // Verify spacing scale compliance:
      // lg: 24px (space-y-6) in layout
      expect(layoutContent).toContain('space-y-6');
      
      // md: 16px (gap-4) in header
      expect(headerContent).toContain('gap-4');
      
      // sm: 8px (gap-2) in tabs
      expect(tabsContent).toContain('gap-2');
    });
  });
});
