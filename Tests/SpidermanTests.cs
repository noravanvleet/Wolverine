using Xunit;

namespace Wolverine;

public class SpidermanTests
{
    [Fact]
    public void Constructor_DefaultName_IsPeterParker()
    {
        var spiderman = new Spiderman();

        Assert.Equal("Peter Parker", spiderman.Name);
    }

    [Fact]
    public void Constructor_CustomName_SetsName()
    {
        var spiderman = new Spiderman("Miles Morales");

        Assert.Equal("Miles Morales", spiderman.Name);
    }

    [Fact]
    public void Constructor_EmptyName_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Spiderman(""));
    }

    [Fact]
    public void Constructor_ZeroHealth_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Spiderman(health: 0));
    }

    [Fact]
    public void Constructor_NegativeWebFluid_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Spiderman(webFluidLevel: -1));
    }

    [Fact]
    public void IsAlive_WithPositiveHealth_ReturnsTrue()
    {
        var spiderman = new Spiderman();

        Assert.True(spiderman.IsAlive);
    }

    [Fact]
    public void IsAlive_AfterFatalDamage_ReturnsFalse()
    {
        var spiderman = new Spiderman(health: 10);
        spiderman.TakeDamage(10);

        Assert.False(spiderman.IsAlive);
    }

    [Fact]
    public void ShootWeb_DecreasesWebFluidByTen()
    {
        var spiderman = new Spiderman(webFluidLevel: 100);
        spiderman.ShootWeb();

        Assert.Equal(10, spiderman.WebFluidLevel);
    }

    [Fact]
    public void ShootWeb_WhenOutOfFluid_ThrowsInvalidOperationException()
    {
        var spiderman = new Spiderman(webFluidLevel: 0);

        Assert.Throws<InvalidOperationException>(() => spiderman.ShootWeb());
    }

    [Fact]
    public void TakeDamage_ReducesHealth()
    {
        var spiderman = new Spiderman(health: 100);
        spiderman.TakeDamage(30);

        Assert.Equal(70, spiderman.Health);
    }

    [Fact]
    public void TakeDamage_ExceedingHealth_ClampsToZero()
    {
        var spiderman = new Spiderman(health: 10);
        spiderman.TakeDamage(999);

        Assert.Equal(0, spiderman.Health);
    }

    [Fact]
    public void TakeDamage_NegativeAmount_ThrowsArgumentException()
    {
        var spiderman = new Spiderman();

        Assert.Throws<ArgumentException>(() => spiderman.TakeDamage(-5));
    }

    [Fact]
    public void TakeDamage_ZeroAmount_ThrowsArgumentException()
    {
        var spiderman = new Spiderman();

        Assert.Throws<ArgumentException>(() => spiderman.TakeDamage(0));
    }

    [Fact]
    public void Swing_ReturnsSwingMessage()
    {
        var spiderman = new Spiderman("Peter Parker");

        var result = spiderman.Swing();

        Assert.Equal("Peter Parker swings through the city!", result);
    }

    [Fact]
    public void Swing_ConsumesWebFluid()
    {
        var spiderman = new Spiderman(webFluidLevel: 100);
        spiderman.Swing();

        Assert.Equal(90, spiderman.WebFluidLevel);
    }

    [Fact]
    public void Swing_WhenDefeated_ThrowsInvalidOperationException()
    {
        var spiderman = new Spiderman(health: 1);
        spiderman.TakeDamage(1);

        Assert.Throws<InvalidOperationException>(() => spiderman.Swing());
    }

    [Fact]
    public void Swing_WhenOutOfWebFluid_ThrowsInvalidOperationException()
    {
        var spiderman = new Spiderman(webFluidLevel: 0);

        Assert.Throws<InvalidOperationException>(() => spiderman.Swing());
    }
}