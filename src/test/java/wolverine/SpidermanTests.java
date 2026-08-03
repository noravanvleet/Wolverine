package wolverine;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class SpidermanTests {

    @Test
    void constructor_DefaultValues_SetsExpectedProperties() {
        var spider = new Spiderman();

        assertEquals("Peter Parker", spider.getName());
        assertEquals(100, spider.getHealth());
        assertEquals(100, spider.getWebFluidLevel());
    }

    @Test
    void constructor_CustomValues_SetsExpectedProperties() {
        var spider = new Spiderman("Miles Morales", 80, 60);

        assertEquals("Miles Morales", spider.getName());
        assertEquals(80, spider.getHealth());
        assertEquals(60, spider.getWebFluidLevel());
    }

    @Test
    void isAlive_AfterFatalDamage_ReturnsFalse() {
        var spider = new Spiderman("Peter Parker", 10, 100);
        spider.takeDamage(10);
        assertFalse(spider.isAlive());
    }

    @Test
    void shootWeb_DecreasesWebFluidByTen() {
        var spider = new Spiderman("Peter Parker", 100, 50);
        spider.shootWeb();
        assertEquals(40, spider.getWebFluidLevel());
    }

    @Test
    void shootWeb_MultipleTimes_DecreasesCumulatively() {
        var spider = new Spiderman("Peter Parker", 100, 30);
        spider.shootWeb();
        spider.shootWeb();
        assertEquals(10, spider.getWebFluidLevel());
    }

    @Test
    void takeDamage_ReducesHealth() {
        var spider = new Spiderman("Peter Parker", 100, 100);
        spider.takeDamage(30);
        assertEquals(70, spider.getHealth());
    }

    @Test
    void takeDamage_ExceedsHealth_ClampsToZero() {
        var spider = new Spiderman("Peter Parker", 10, 100);
        spider.takeDamage(999);
        assertEquals(0, spider.getHealth());
    }

    @Test
    void lexLutherInterceptsWebUsingSuperGirlsDogYo_DecreasesHealth() {
        var spider = new Spiderman("Peter Parker", 80, 60);
        spider.lexLutherInterceptsWebUsingSuperGirlsDogYo();
        assertEquals(10, spider.getHealth());
    }
}
